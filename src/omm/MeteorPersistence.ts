
import Status from "./Status"
import {Collection, CollectionUpdateResult} from "./Collection"
import Serializer from "../serializer/Serializer"
import ObjectRetriever from "../serializer/ObjectRetriever"
import { SerializationPath } from "./SerializationPath"
import { MeteorPersistable } from "./MeteorPersistable"
import * as omm_annotation from "../annotations/PersistenceAnnotation"
import * as omm_event from "../event/OmmEvent"
import * as Config from "./Config"
import * as mongodb from "mongodb"
import * as wm from "@bvanheukelom/web-methods"
import * as Promise from "bluebird"

export var methodContext:any;

export class CallHelper<T extends Object>{
    object:T;
    callback:(error:any, result?:any)=>void;
    constructor( o, cb?:(error:any, result?:any)=>void ){
        this.object = o;
        this.callback = cb;
    }
}

export function registerObject<O extends Object>( key:string, o:O ){
    omm_annotation.registeredObjects[key] = o;
}

export function getRegisteredObject( key:string ):any{
    return omm_annotation.registeredObjects[key];
}


function call( methodName:string, objectId:string, args:any[]  ):Promise<any>{
    console.log( "Call web method "+methodName, objectId, args);

    if( !MeteorPersistence.isInitialized() )
        throw new Error("omm is not initialized.");
    // convert the arguments to their origin
    for (var i in args) {
        if (args[i]._serializationPath) {
            args[i] = args[i]._serializationPath.toString();
        }
        else if(typeof args[i]!="function") {

            args[i] = MeteorPersistence.serializer.toDocument(args[i]);
        }
    }
    // prepend
    args.unshift( objectId );
    args.unshift( methodName );
    debugger;
    var p:Promise<any> = MeteorPersistence.clientWebMethods.call.apply(MeteorPersistence.clientWebMethods, args);
    return p.then((result:any)=>{
        console.log( "web method returned "+ result );
        // convert the result from json to an object
        if( result ) {
            var serializationPath = result.serializationPath;
            if( result.className ){
                result = MeteorPersistence.serializer.toObject(result);
                if (serializationPath) {
                    omm_annotation.setNonEnumerableProperty(result, "_serializationPath", new SerializationPath(serializationPath));
                    // we probably want to update the serialization paths for sub objects here
                }
            }
        }
        return result;
    });
}

export class MeteorPersistence {
    static wrappedCallInProgress = false;
    static nextCallback;
    private static initialized = false;
    static meteorObjectRetriever:ObjectRetriever;
    static serializer:Serializer;

    static db:mongodb.Db;
    static serverWebMethods:wm.WebMethods;
    static clientWebMethods:wm.WebMethods;

    static init() {
        if (!MeteorPersistence.initialized) {
            MeteorPersistence.serializer = new Serializer( );
            // Serializer.init();
            omm_annotation.PersistenceAnnotation.getEntityClasses().forEach(function (c:omm_annotation.TypeClass<Object>) {
                MeteorPersistence.wrapClass(c);
            });


            omm_annotation.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function(functionName:string){
                var methodOptions:omm_annotation.IMethodOptions = omm_annotation.PersistenceAnnotation.getMethodOptions( functionName );
                MeteorPersistence.createWebMethod(methodOptions);
            });

            MeteorPersistence.initialized = true;
        }
    }

    static isInitialized():boolean{
        return MeteorPersistence.initialized;
    }

    static attachClassName( o:any ){
        var className = MeteorPersistence.getClassName(o);
        if( className && omm_annotation.entityClasses[className] ){
            o.className = className;
        }
        if( o._serializationPath )
            o.serializationPath = o._serializationPath.toString();
    }

    // TODO new name
    static objectsClassName(o:any):string {
        return omm_annotation.className(o.constructor);
    }

    getId(object:MeteorPersistable):string {
        if (object._serializationPath)
            return object._serializationPath.toString();
        else {
            var objectClass = omm_annotation.PersistenceAnnotation.getClass(object);
            var idPropertyName = omm_annotation.PersistenceAnnotation.getIdPropertyName(objectClass);
            var id = object[idPropertyName];
            if (omm_annotation.PersistenceAnnotation.isRootEntity(objectClass) && id) {
                return new SerializationPath( omm_annotation.PersistenceAnnotation.getCollectionName(objectClass), id).toString();
            }
            else {
                throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
            }
        }
    }


    static retrieveObject( objectId:string ):Promise<any>{
        var registeredObject = omm_annotation.registeredObjects[objectId];
        if( registeredObject )
            return Promise.resolve(registeredObject);
        else{
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new SerializationPath( objectId );
            var collectionName = sPath.getCollectionName();
            var collection:Collection<Object> = collectionName ? Collection.getByName( collectionName ) : undefined;
            if (collection) {
                return collection.getById(sPath.getId()).then((o)=>{
                    return sPath.getSubObject(o);
                });
            }
            else
                Promise.reject( "No collection found to retrieve object. Key:" + objectId );
        }
    }


    // converts parameters given to the web method from documents to objects
    static convertWebMethodParameters( args:Array<any>, classNames:Array<string> ){
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm_annotation.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = MeteorPersistence.retrieveObject(args[i]);
                    else if (typeof args[i] == "object")
                        args[i] = MeteorPersistence.serializer.toObject(args[i], cls);
                }
            }
        }
    }




    private static webMethodInProgress:boolean = false;
    static createWebMethod(options:omm_annotation.IMethodOptions){
        console.log("Creating web methods ", options.name );

        // patch the objects function to call the web method
        MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction, ...a:any[]) {
            console.log("Running replacer function of a function that is also a web method. Name:"+options.name );
            var key = omm_annotation.isRegisteredWithKey(this) || ( this._serializationPath ? this._serializationPath.toString() : undefined );
            var r:any;

            // this is a more elaborate than necessary. "isServer()" should be enough but then the tests would not work properly.
            var isServ:boolean = (!this._serializationPath && isServer()) || (this._serializationPath && !this._serializationPath.isClient);

            if( !options.serverOnly || isServ || !key ){
                console.log( "Running original function of web method "+options.name);
                r = originalFunction.apply(this, a);
            }
            if( !isServ && key ) {
                r = call(options.name, key, a);
            }
            return r;
        });
        
        // register the web method
        if( MeteorPersistence.serverWebMethods ) {
            MeteorPersistence.serverWebMethods.add(options.name, (...args:any[])=> {
                console.log("Web method " + options.name);

                // the object id is the first parameter
                var objectId = args.shift();

                // convert parameters given to the web method from documents to objects
                MeteorPersistence.convertWebMethodParameters(args, options.parameterTypes);

                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = MeteorPersistence.retrieveObject(objectId)

                    // call function
                    .then((object:any)=> {
                        return object[options.name].originalFunction.apply(object, args);
                    })

                    // convert the result to a document
                    .then((result)=> {
                        MeteorPersistence.attachClassName(result);
                        var r = MeteorPersistence.serializer.toDocument(result);
                        console.log("Result of web method " + options.name + " is ", r);
                        return r;
                    });

                // return the promise
                return p;
            });
        }
    }


    /**
     * This patches the functions that are collection updates.
     * It also emits update events: pre:<FunctionName> post:<FunctionName>.
     * @param c
     */
    static wrapClass<T extends Object>(entityClass:omm_annotation.TypeClass<T>) {

        //var className = omm_annotation.className(c);
        var that = this;
        omm_annotation.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function(functionName:string){
            MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction, ...args:string[]) {
                //console.log("updating object:",this, "original function :"+originalFunction);
                var _serializationPath:SerializationPath = this._serializationPath;
                if( !_serializationPath || _serializationPath.isClient ){
                    return originalFunction.apply(this, args);
                }
                
                var rootObject;
                var object;
                var collection:Collection<any>;
                var objectPromise:Promise<any>;

                var rootObjectPromise:Promise<any>;


                // get the responsible collection
                collection = Collection.getByName( _serializationPath.getCollectionName() );
                // load the object

                rootObjectPromise =  collection.getById(_serializationPath.getId());
                objectPromise = rootObjectPromise.then((rootObject:any)=>{
                    return object =_serializationPath.getSubObject(rootObject);
                });


                return Promise.all([objectPromise,rootObjectPromise]).then((values:any[])=>{
                    var object:any = values[0];
                    var rootObject:any = values[1];
                    // create the event context
                    var ctx = new omm_annotation.EventContext( object, collection );
                    ctx.methodContext = Status.methodContext;
                    ctx.functionName = functionName;
                    ctx.serializationPath = _serializationPath;
                    ctx.rootObject = rootObject;

                    // emit the pre-event
                    omm_event.callEventListeners( entityClass, "pre:"+functionName, ctx );
                    omm_event.callEventListeners( entityClass, "pre", ctx );

                    var preUpdateObject = object;

                    if( ctx.cancelledWithError() ){
                        return Promise.reject(ctx.cancelledWithError());
                    } else {
                        var resultPromise:Promise<CollectionUpdateResult> = collection.update( object._serializationPath, function (subObject) {
                            var r2 = originalFunction.apply(subObject, args);
                            return r2;
                        }).then((r:CollectionUpdateResult)=>{
                            debugger;
                            console.log("Events collected during updating ", r.events);
                            collection.sendEventsCollectedDuringUpdate( r.object, r.object, r.rootObject,functionName, object._serializationPath, r.events );
                            return r.result;
                        });

                        return resultPromise;
                    }
                })
            });
        });
    }






    // todo  make the persistencePath enumerable:false everywhere it is set
    private static getClassName(o:Object):string {
        if( typeof o =="object" && omm_annotation.PersistenceAnnotation.getClass( o )) {
            return omm_annotation.className( omm_annotation.PersistenceAnnotation.getClass( o ) );
        }
        else
            return typeof o;
    }

    static monkeyPatch( object:any, functionName:string, patchFunction:(original:Function, ...arg:any[])=>any) {
        var originalFunction = object[functionName];
        object[functionName] = function monkeyPatchFunction() {
            var args = [];
            args.push(originalFunction);
            for( var i in arguments ) {
                args.push(arguments[i]);
            }
            return patchFunction.apply(this,args);
        };
        object[functionName].originalFunction = originalFunction;
    }
}




var endpointUrl:string;

export function load<T>( cls:omm_annotation.TypeClass<T>, id:string ):Promise<T>{
    var webMethods = new wm.WebMethods(endpointUrl);
    var serializer = new Serializer();
    if( !omm_annotation.PersistenceAnnotation.isRootEntity(cls) ){
        throw new Error("Given class is not a root entity");
    }
    var className = omm_annotation.className(cls);
    return webMethods.call( "get", className, id ).then( (doc)=>{
        var o = serializer.toObject( doc, cls );
        var collectionName = omm_annotation.PersistenceAnnotation.getCollectionName(cls);
        var sp = new SerializationPath( collectionName, id );
        sp.isClient = true;
        SerializationPath.setSerializationPath( o, sp );
        SerializationPath.updateSerializationPaths(o);
        return o;
    });
}

function registerGetter( webMethods:wm.WebMethods ){
    var serializer = new Serializer();
    webMethods.add("get", (className:string, objectId:string)=>{
        console.log("Getter "+className, objectId );
        var type = omm_annotation.entityClasses[className];
        var collectionName  = type ? omm_annotation.PersistenceAnnotation.getCollectionName( type ) : undefined;
        var objPromise = collectionName ? MeteorPersistence.retrieveObject(collectionName+"["+objectId+"]") : undefined;
        return objPromise.then((obj)=>{
            return obj ? serializer.toDocument(obj) : undefined;
        });
    });
}

export function init( host:string, port:number ){
    endpointUrl = "http://"+host+":"+port+"/methods";
    MeteorPersistence.clientWebMethods = new wm.WebMethods(endpointUrl);
    MeteorPersistence.init();

}

export function isServer():boolean{
    return !!MeteorPersistence.db;
}

export function startServer( mongoUrl:string, port:number ):Promise<any>{

    return mongodb.MongoClient.connect( mongoUrl, {promiseLibrary:Promise}).then((db:mongodb.Db)=>{
        MeteorPersistence.db = db;
        MeteorPersistence.serverWebMethods = new wm.WebMethods("http://localhost:"+port+"/methods");
        registerGetter(MeteorPersistence.serverWebMethods);
        MeteorPersistence.init();
        console.log("starting");
        return MeteorPersistence.serverWebMethods.start(7000);
    });
}


