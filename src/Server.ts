/**
 * Created by bert on 07.07.16.
 */

import * as omm from "./omm"
import * as wm from "@bvanheukelom/web-methods"
import * as Promise from "bluebird"
import * as expressModule from "express"
import * as path from "path"
import * as mongo from "mongodb"

export class Server{

    private collections:{ [index:string]: omm.Collection<any> } = {};
    private services:{ [index:string]: any } = {};
    private webMethods:wm.WebMethods;
    private serializer:omm.Serializer;
    private methodListener:Array<omm.EventListener<any>> = [];
    private express:expressModule.Application;
    private isOwnExpress:boolean;
    private webRootPath: string;
    private mongoDb:mongo.Db;
    private mongoUrl:string;

    private webMethodsAdded:Array<string> = [];

    constructor( theMongo?:mongo.Db|string, theExpress?:expressModule.Application ) {
        this.webMethods = new wm.WebMethods();
        this.serializer = new omm.Serializer();
        this.registerGetter();
        this.express = theExpress;
        if( !theExpress ) {
            this.express = expressModule();
            this.isOwnExpress = true;
        }
        if( typeof theMongo=="string" ) {
            this.mongoUrl = <string>theMongo;
        }else{
            this.mongoDb = <mongo.Db>theMongo;
        }
    }

    start( port?:number ):Promise<void>{
        this.addAllWebMethods();
        this.webMethods.registerEndpoint(this.express);
        var p = Promise.resolve();
        if( !this.mongoDb ) {
            p = p.then(()=> {
                return <any>mongo.MongoClient.connect(this.mongoUrl, {promiseLibrary: Promise}).then((db:mongo.Db)=> {
                    this.mongoDb = db;
                    for( var i in this.collections ){
                        var c:omm.Collection<any> = this.collections[i];
                        c.setMongoCollection(db);
                    }
                    return db;
                });
            });
        }
        if( this.isOwnExpress ) {
            p = p.then(()=> {
                return new Promise<void>((resolve, reject)=> {
                    var p = port ? port : 8080;
                    this.express.listen(p, () => {
                        console.log('Web server is listening on *:' + p + ( this.webRootPath ? (', serving ' + this.webRootPath) : ""));
                        resolve();
                    });
                });
            });
        }
        return p;
    }
    
    getExpress():expressModule.Application{
        return this.express;
    }

    serveStatic( theWebRootPath:string, indexFileName?:string ){
        this.webRootPath = theWebRootPath;
        var indexFileName = indexFileName ? indexFileName : "index.html";
        this.express.get('/*', (req:any, res:any, next:Function)  => {

            //This is the current file they have requested
            var file = req.params[0];
            // if( file.indexOf( "js/")!=0 && file.indexOf( "css/")!=0 && file.indexOf( "fonts/")!=0  && file.indexOf( "img/" )!=0 && file.indexOf( "src/")!=0 &&file.indexOf( "components/")!=0 &&file.indexOf( "bootstrap/")!=0 && file.indexOf( "bundle")!=0 )
            //     file = indexFileName;

            var fileName = path.resolve(this.webRootPath, file);

            console.log("file : ", file, " path:", fileName);
            res.sendFile(fileName);

        });

        this.express.get('/', (req:any, res:any, next:Function)  => {
            var fileName = path.resolve(this.webRootPath, indexFileName);
            res.sendFile(fileName);
        });
    }

    addCollection( c: omm.Collection<any> ):void{
        this.collections[c.getName()] = c;
        if( this.mongoDb )
            c.setMongoCollection(this.mongoDb);
    }

    registerService( name:string, service:any ):void{
        this.services[name] = service;
        // singletons dont need a
        if( typeof service=="object" )
            omm.SerializationPath.setObjectContext(service, undefined, this);

        var serviceClass = omm.Reflect.getClass(service);
        omm.Reflect.getRemoteFunctionNames(serviceClass).forEach((remoteFunctionName:string)=>{
            this.addWebMethod( omm.Reflect.getMethodOptions(serviceClass,remoteFunctionName) );
        });
    }

    /**
     * @deprecated
     */
    addSingleton( name:string, service:any ):void{
       this.registerService(name, service);
    }

    private notifyMethodListeners( object:any, objectId:string, functionName:string, args:any[], userData:any ):Promise<void>{
        var collection;
        var i1 = objectId.indexOf("[");
        var i2 = objectId.indexOf("]");
        if(i1!=-1 && i2!=-1 && i1<i2)
            collection = this.getCollection(objectId);

        var context = new omm.EventContext(object, collection);
        context.functionName = functionName;
        context.objectId = objectId;
        context.userData = userData;
        context.arguments = args;
        var promises = [];
        this.methodListener.forEach((ml:omm.EventListener<any>)=>{
            if( !context.cancelledWithError() ) {
                promises.push( Promise.cast( ml(context, undefined) ) );
            } else {
                promises.push( Promise.reject( context.cancelledWithError() ) );
            }
        });
        return Promise.all( promises ).then(()=>{

        });
    }

    onMethod( eventHandler:omm.EventListener<any> ){
        this.methodListener.push(eventHandler);
    }

    removeAllMethodListeners(){
        this.methodListener = [];
    }

    static userData:any;
    private addAllWebMethods():void {
        console.log( "adding web methods" );
        omm.Reflect.getEntityClasses().forEach((c:omm.TypeClass<any>)=>{
            omm.Reflect.getRemoteFunctionNames(c).forEach((remoteFunctionName:string)=>{
                this.addWebMethod(omm.Reflect.getMethodOptions(c,remoteFunctionName));
            });
        });
    }

    private addWebMethod( options:omm.IMethodOptions ){
        if( this.webMethodsAdded.indexOf(options.name)!=-1 )
            return;
        this.webMethodsAdded.push(options.name);
        console.log("Adding Web method " + options.name);
        this.webMethods.add(options.name, (...args:any[])=> {
            var startTime = Date.now();

            // the object id is the first parameter
            var objectId = args.shift();

            // the user Data is the second parameter
            var userData = args.shift();
            console.log(new Date()+": WebMethod invokation. Name:" + options.name, "User data ", userData);

            // convert parameters given to the web method from documents to objects
            this.convertWebMethodParameters(args, options.parameterTypes, userData);

            // load object based on the object id. this could either be a registered object or an object form a collection
            var p = this.retrieveObject(objectId, userData)

                // call function
                .then((object:any)=> {
                    // this might be the collection update or another function that is called directly

                    console.log("Notifying method event listensers.");
                    Server.userData = userData;
                    return this.notifyMethodListeners( object, objectId, options.name, args, userData ).then(()=>{
                        return object;
                    });

                })
                .then((object:any)=> {
                    Server.userData = userData; // this needs to go into the thing more or less
                    var r =  object[options.propertyName].apply(object, args);
                    Server.userData = undefined;
                    return r;
                })
                // convert the result to a document
                .then((result)=> {
                    var res:any = {};
                    if( result ){
                        res.document = this.serializer.toDocument(result, true, true);
                    }

                    console.log("Result of web method " + options.name + " (calculated in "+(Date.now()-startTime)+"ms) is ", res);
                    return res;
                });

            // return the promise
            return p;
        });
    }

    private getCollection(objectId:string):omm.Collection<any>{
        var sPath = new omm.SerializationPath( objectId );
        var collectionName = sPath.getCollectionName();
        var collection:omm.Collection<Object> = collectionName ? this.collections[collectionName] : undefined;
        return collection;
    }

    private retrieveObject( objectId:string, userData:any ):Promise<any>{
        var singleton = this.services[objectId];
        if( singleton ) {
            var s:any = singleton;
            if( typeof singleton == "function" ){
                s = singleton(userData);
            }
            return Promise.resolve(s);
        }
        else{
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath( objectId );
            var collection = this.getCollection(objectId);
            if (collection) {
                return collection.getById(sPath.getId()).then((o)=>{
                    return sPath.getSubObject(o);
                });
            }
            else
                return Promise.reject( "No collection found to retrieve object. Key:" + objectId );
        }
    }

    private attachClassName( o:any ){
        var className = omm.Reflect.getClassName(o);
        if( className && omm.entityClasses[className] ){
            o.className = className;
        }
        if( o._serializationPath )
            o.serializationPath = o._serializationPath.toString();
    }
    
    private registerGetter(){
        this.webMethods.add("get", (collectionName:string, objectId:string)=>{
            console.log(new Date()+": Getter. CollectionName:"+collectionName+" Id:"+objectId );
            // var type = omm.entityClasses[className];
            // var collectionName  = type ? omm.PersistenceAnnotation.getCollectionName( type ) : undefined;
            var objPromise = collectionName ? this.retrieveObject(collectionName+"["+objectId+"]", undefined) : undefined;
            return objPromise.then((obj)=>{
                var doc = obj ? this.serializer.toDocument(obj, true, true) : undefined;
                return doc;
            });
        });
    }
    
    // converts parameters given to the web method from documents to objects
    private convertWebMethodParameters( args:Array<any>, classNames:Array<string>, userData:any ){
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm.Reflect.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = this.retrieveObject(args[i], userData);
                    else if (typeof args[i] == "object")
                        args[i] = this.serializer.toObject(args[i], cls);
                }
            }
        }
    }

}


