/**
 * Created by bert on 07.07.16.
 */

import * as reob from "./reob"
import {Collection} from "./Collection"
import * as wm from "web-methods"
import * as Promise from "bluebird"
import * as expressModule from "express"
import * as path from "path"
import * as mongo from "mongodb"
import * as fs from "fs"
import * as compression from "compression"

export declare type LoadingCheck = (id:string, request:reob.Request, obj:reob.OmmObject ) => boolean|Promise<void>;
export declare type ServiceProvider = (s:reob.Request) => Object
export class Server{

    private collections:{ [index:string]:Collection<any> } = {};
    private collectionLoadingEnabled:{ [index:string]:boolean|LoadingCheck } = {};
    private services:{ [index:string]: Object|ServiceProvider } = {};
    private webMethods:wm.WebMethods;
    private serializer:reob.Serializer;
    private methodListener:Array<reob.EventListener<any>> = [];
    private express:expressModule.Application;
    private webRootPath: string;
    private indexFileName: string;
    private mongoDb:mongo.Db;
    private mongoUrl:string;
    private port:number;

    private requestFactory : (ud:any)=>reob.Request;

    private webMethodsAdded:Array<string> = [];

    constructor( theMongo?:mongo.Db|string ) {
        this.webMethods = new wm.WebMethods();
        this.serializer = new reob.Serializer();
        this.express = expressModule();
        this.express.use(compression());
        
        if( typeof theMongo=="string" ) {
            this.mongoUrl = <string>theMongo;
        }else{
            this.mongoDb = <mongo.Db>theMongo;
        }
    }

    getWebRootPath():string{
        return this.webRootPath;
    }

    start( port?:number ):Promise<void>{
        this.webMethods.registerEndpoint(this.express);
        this.addAllEntityWebMethods();
        this.registerGetter();
        if( this.webRootPath ){
            this.registerStaticGET();
        }
        this.port = port;
        var p = Promise.resolve();
        if( !this.mongoDb ) {
            p = p.then(()=> {
                return <any>mongo.MongoClient.connect(this.mongoUrl, {promiseLibrary: Promise}).then((db:mongo.Db)=> {
                    this.mongoDb = db;
                    for( var i in this.collections ){
                        var c:Collection<any> = this.collections[i];
                        c.setMongoCollection(db);
                    }
                    return db;
                });
            });
        }
        p = p.then(()=> {
            return new Promise<void>((resolve, reject)=> {
                this.port = this.port ? this.port : 8080;
                this.express.listen(this.port, () => {
                    if( reob.isVerbose() )console.log('Web server is listening on *:' + this.port + ( this.webRootPath ? (', serving ' + this.webRootPath) : ""));
                    resolve();
                });
            });
        });
        return p;
    }
    
    getExpress():expressModule.Application{
        return this.express;
    }

    serveStatic( theWebRootPath:string, indexFileName?:string ) {
        this.webRootPath = theWebRootPath;
        this.indexFileName = indexFileName ? indexFileName : "index.html";
    }

    private registerStaticGET(){
        if( this.webRootPath && this.indexFileName ) {
            this.express.get('/*', (req:any, res:any, next:Function) => {

                //This is the current file they have requested
                var file = req.params[0];
                // if( file.indexOf( "js/")!=0 && file.indexOf( "css/")!=0 && file.indexOf( "fonts/")!=0  && file.indexOf( "img/" )!=0 && file.indexOf( "src/")!=0 &&file.indexOf( "components/")!=0 &&file.indexOf( "bootstrap/")!=0 && file.indexOf( "bundle")!=0 )
                //     file = indexFileName;

                var fileName = path.resolve(this.webRootPath, file);
                fs.exists(fileName, (exists:boolean) => {
                    if( reob.isVerbose() )console.log("file : ", file, " path:", fileName, (!exists?"Does not exist.":"") );
                    if (!exists)
                        fileName = path.resolve(this.webRootPath, this.indexFileName);
                    res.sendFile(fileName);
                });
            });

            this.express.get('/', (req:any, res:any, next:Function) => {
                var fileName = path.resolve(this.webRootPath, this.indexFileName);
                res.sendFile(fileName);
            });
        }
    }

    addCollection( c: Collection<any> ):void{
        this.collections[c.getName()] = c;
        if( this.mongoDb )
            c.setMongoCollection(this.mongoDb);
    }

    setLoadingAllowed(c:Collection<any>, i:boolean|LoadingCheck ) {
        this.collectionLoadingEnabled[c.getName()] = i;
    }

    addService( serviceName, service:Object|ServiceProvider ):void{

        // singletons dont need a
        var o;
        if( typeof service=="object" ) {
            reob.SerializationPath.setObjectContext(service, undefined, this, undefined);
            o = service;
        }else{
            o = (<Function>service)({});
        }
        var serviceClass = reob.Reflect.getClass(o);
        // var serviceName = omm.Reflect.getServiceName(serviceClass);
        // if( !serviceName )
        //     throw new Error("Added service has no @Service decorator. Class name:"+ omm.Reflect.getClassName(o) );
        this.services[serviceName] = service;

        var serviceClass = reob.Reflect.getClass(o);
        reob.Reflect.getRemoteFunctionNames(serviceClass).forEach((remoteFunctionName:string)=>{
            var options = reob.Reflect.getMethodOptions(serviceClass,remoteFunctionName);
            if( !options.name ) {
                options.name = serviceName + "." + options.propertyName;
            }
            this.addWebMethod( options );
        });
    }

    private notifyMethodListeners( object:any, objectId:string, functionName:string, args:any[], request:reob.Request ):Promise<void>{
        var collection;
        if( objectId ){
            var i1 = objectId.indexOf("[");
            var i2 = objectId.indexOf("]");
            if(i1!=-1 && i2!=-1 && i1<i2)
                collection = this.getCollection(objectId);
        }
        var context = new reob.EventContext(object, collection);
        context.functionName = functionName;
        context.objectId = objectId;
        context.request = request;
        context.arguments = args;
        var promises = [];
        this.methodListener.forEach((ml:reob.EventListener<any>)=>{
            if( !context.cancelledWithError() ) {
                promises.push( Promise.cast( ml(context, undefined) ) );
            } else {
                promises.push( Promise.reject( context.cancelledWithError() ) );
            }
        });
        return Promise.all( promises ).then(()=>{

        });
    }

    onMethod( eventHandler:reob.EventListener<any> ){
        this.methodListener.push(eventHandler);
    }

    removeAllMethodListeners(){
        this.methodListener = [];
    }

    private addAllEntityWebMethods():void {
        if( reob.isVerbose() )console.log( "adding web methods" );
        reob.Reflect.getEntityClasses().forEach((c:reob.TypeClass<any>)=>{
            reob.Reflect.getRemoteFunctionNames(c).forEach((remoteFunctionName:string)=>{
                var options = reob.Reflect.getMethodOptions(c,remoteFunctionName);
                if( !options.name ){
                    options.name = reob.Reflect.getClassName(c)+"."+options.propertyName;
                }
                this.addWebMethod(options);
            });
        });
    }

    getPort():number{
        return this.port;
    }

    setRequestFactory( f : (userData:any)=>reob.Request ){
        this.requestFactory = f;
    }

    protected createRequest( userData:any ):reob.Request{
        if( this.requestFactory ){
            return this.requestFactory( userData );
        } else {
            return new reob.Request(userData);
        }
    }

    private addWebMethod( options:reob.IMethodOptions ){
        if( this.webMethodsAdded.indexOf(options.name)!=-1 )
            return;
        this.webMethodsAdded.push(options.name);
        if( reob.isVerbose() )console.log("Adding Web method " + options.name);
        this.webMethods.add(options.name, (...args:any[])=> {
                var startTime = Date.now();

                // the object id is the first parameter
                var objectId = args.shift();

                // the user Data is the second parameter
                var userData = args.shift();
                var request:reob.Request = this.createRequest( userData );
                if( reob.isVerbose() )console.log(new Date() + ": WebMethod invokation. Name:" + options.name, "User data ", userData);

                // convert parameters given to the web method from documents to objects
                this.convertWebMethodParameters(args, options.parameterTypes, userData);

                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = this.retrieveObject(objectId, request)

                    // call function
                    .then((object:any)=> {
                        // this might be the collection update or another function that is called directly

                        if( reob.isVerbose() )console.log("Notifying method event listensers.");
                        return this.notifyMethodListeners(object, objectId, options.name, args, request).then(()=> {
                            return object;
                        });

                    })
                    .then((object:any)=> {
                        var r = object[options.propertyName].apply(object, args);
                        return r;
                    })
                    // convert the result to a document
                    .then((result)=> {
                        var res:any = {};
                        if (result) {
                            res.document = this.serializer.toDocument(result, true, true);
                        }

                        if( reob.isVerbose() )console.log("Result of web method " + options.name + " (calculated in " + (Date.now() - startTime) + "ms) is ", res);
                        return res;
                    });

                // return the promise
                return p;
        });
    }

    private getCollection(objectId:string):Collection<any>{
        var sPath = new reob.SerializationPath( objectId );
        var collectionName = sPath.getCollectionName();
        var collection:Collection<Object> = collectionName ? this.collections[collectionName] : undefined;
        return collection;
    }

    private retrieveObject( objectId:string, request:reob.Request ):Promise<any>{
        var service = this.services[objectId];
        if( service ) {
            var s:any = service;
            if( typeof service == "function" ){
                s = (<ServiceProvider>service)(request);
            }
            return Promise.resolve(s);
        }
        else{
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new reob.SerializationPath( objectId );
            var collection = this.getCollection(objectId);
            if (collection) {
                return collection.getById(sPath.getId(), request).then((o)=>{
                    return sPath.getSubObject(o);
                });
            }
            else
                return Promise.reject( "No collection found to retrieve object. Key:" + objectId );
        }
    }

    // private attachClassName( o:any ){
    //     var className = reob.Reflect.getClassName(o);
    //     if( className && reob.entityClasses[className] ){
    //         o.className = className;
    //     }
    //     if( o._serializationPath )
    //         o.serializationPath = o._serializationPath.toString();
    // }
    
    private registerGetter(){
        this.webMethods.add("get", (collectionName:string, objectId:string, userData:any )=>{
            var request:reob.Request = this.createRequest( userData );
            var allowedPromise:Promise<void>;

            if( reob.isVerbose() )console.log(new Date() + ": Getter. CollectionName:" + collectionName + " Id:" + objectId, "UserData:", userData);

            return new Promise<reob.OmmObject>((resolve, reject)=>{
                if( collectionName )
                    resolve( this.retrieveObject(collectionName + "[" + objectId + "]", request) );
                else
                    reject( new Error("No collection name given") );
            }).then((object)=>{
                var i:any = this.collectionLoadingEnabled[collectionName];
                if( typeof i == "function" ){
                    return Promise.cast( i( objectId, request, object ) ).then(()=>object);
                }else{
                    return Promise.cast( i ).then(()=>object);
                }
            }).then((obj)=> {
                    return this.notifyMethodListeners(this, undefined, "get", [collectionName, objectId], request).then(()=> obj);
            }).then((obj)=> {
                var doc = obj ? this.serializer.toDocument(obj, true, true) : undefined;
                return doc;
            });
        });
    }
    
    // converts parameters given to the web method from documents to objects
    private convertWebMethodParameters( args:Array<any>, classNames:Array<string>, request:reob.Request ){
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = reob.Reflect.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = this.retrieveObject(args[i], request);
                    else if (typeof args[i] == "object")
                        args[i] = this.serializer.toObject(args[i], cls);
                }
            }
        }
    }


}


