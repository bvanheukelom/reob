/**
 * Created by bert on 07.07.16.
 */

import * as omm from "./omm"
import * as wm from "@bvanheukelom/web-methods"
import * as Promise from "bluebird"
import * as expressModule from "express"
import * as path from "path"
import * as mongo from "mongodb"
import * as fs from "fs"
import * as compression from "compression"

export declare type LoadingCheck = (id:string, session:omm.Session) => boolean;

export class Server{

    private collections:{ [index:string]:omm.Collection<any> } = {};
    private collectionLoadingEnabled:{ [index:string]:boolean|LoadingCheck } = {};
    private services:{ [index:string]: any } = {};
    private webMethods:wm.WebMethods;
    private serializer:omm.Serializer;
    private methodListener:Array<omm.EventListener<any>> = [];
    private express:expressModule.Application;
    private isOwnExpress:boolean;
    private webRootPath: string;
    private indexFileName: string;
    private mongoDb:mongo.Db;
    private mongoUrl:string;
    private port:number;

    private webMethodsAdded:Array<string> = [];

    constructor( theMongo?:mongo.Db|string ) {
        this.webMethods = new wm.WebMethods();
        this.serializer = new omm.Serializer();
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
                        var c:omm.Collection<any> = this.collections[i];
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
                    if( omm.verbose )console.log('Web server is listening on *:' + this.port + ( this.webRootPath ? (', serving ' + this.webRootPath) : ""));
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
                    if( omm.verbose )console.log("file : ", file, " path:", fileName, (!exists?"Does not exist.":"") );
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

    addCollection( c: omm.Collection<any> ):void{
        this.collections[c.getName()] = c;
        if( this.mongoDb )
            c.setMongoCollection(this.mongoDb);
    }

    setLoadingAllowed( c:omm.Collection<any>, i:boolean|LoadingCheck ) {
        this.collectionLoadingEnabled[c.getName()] = i;
    }

    addService(name:string, service:Object|Function ):void{
        this.services[name] = service;
        // singletons dont need a
        var o;
        if( typeof service=="object" ) {
            omm.SerializationPath.setObjectContext(service, undefined, this, undefined);
            o = service;
        }else{
            o = (<Function>service)({});
        }

        var serviceClass = omm.Reflect.getClass(o);
        omm.Reflect.getRemoteFunctionNames(serviceClass).forEach((remoteFunctionName:string)=>{
            this.addWebMethod( omm.Reflect.getMethodOptions(serviceClass,remoteFunctionName) );
        });
    }

    /**
     * @deprecated
     */
    addSingleton( name:string, service:any ):void{
       this.addService(name, service);
    }

    private notifyMethodListeners( object:any, objectId:string, functionName:string, args:any[], session:omm.Session ):Promise<void>{
        var collection;
        if( objectId ){
            var i1 = objectId.indexOf("[");
            var i2 = objectId.indexOf("]");
            if(i1!=-1 && i2!=-1 && i1<i2)
                collection = this.getCollection(objectId);
        }
        var context = new omm.EventContext(object, collection);
        context.functionName = functionName;
        context.objectId = objectId;
        context.session = session;
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

    private addAllEntityWebMethods():void {
        if( omm.verbose )console.log( "adding web methods" );
        omm.Reflect.getEntityClasses().forEach((c:omm.TypeClass<any>)=>{
            omm.Reflect.getRemoteFunctionNames(c).forEach((remoteFunctionName:string)=>{
                this.addWebMethod(omm.Reflect.getMethodOptions(c,remoteFunctionName));
            });
        });
    }

    getPort():number{
        return this.port;
    }

    private addWebMethod( options:omm.IMethodOptions ){
        if( this.webMethodsAdded.indexOf(options.name)!=-1 )
            return;
        this.webMethodsAdded.push(options.name);
        if( omm.verbose )console.log("Adding Web method " + options.name);
        this.webMethods.add(options.name, (...args:any[])=> {
                var startTime = Date.now();

                // the object id is the first parameter
                var objectId = args.shift();

                // the user Data is the second parameter
                var userData = args.shift();
                var session = new omm.Session( userData );
                if( omm.verbose )console.log(new Date() + ": WebMethod invokation. Name:" + options.name, "User data ", userData);

                // convert parameters given to the web method from documents to objects
                this.convertWebMethodParameters(args, options.parameterTypes, userData);

                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = this.retrieveObject(objectId, session)

                    // call function
                    .then((object:any)=> {
                        // this might be the collection update or another function that is called directly

                        if( omm.verbose )console.log("Notifying method event listensers.");
                        return this.notifyMethodListeners(object, objectId, options.name, args, session).then(()=> {
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

                        if( omm.verbose )console.log("Result of web method " + options.name + " (calculated in " + (Date.now() - startTime) + "ms) is ", res);
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

    private retrieveObject( objectId:string, session:omm.Session ):Promise<any>{
        var singleton = this.services[objectId];
        if( singleton ) {
            var s:any = singleton;
            if( typeof singleton == "function" ){
                s = singleton(session);
            }
            return Promise.resolve(s);
        }
        else{
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath( objectId );
            var collection = this.getCollection(objectId);
            if (collection) {
                return collection.getById(sPath.getId(), session).then((o)=>{
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
        this.webMethods.add("get", (collectionName:string, objectId:string, userData:any )=>{
            var i:any = this.collectionLoadingEnabled[collectionName];
            var session:omm.Session = new omm.Session(userData);
            var allowed = !!i;
            if( allowed && typeof i == "function" ){
                allowed = i( objectId, session );
            }
            if( allowed ){
                if( omm.verbose )console.log(new Date() + ": Getter. CollectionName:" + collectionName + " Id:" + objectId, "UserData:", userData);
                var objPromise = collectionName ? this.retrieveObject(collectionName + "[" + objectId + "]", undefined) : Promise.reject(new Error("No collection name given"));
                return objPromise.then((obj)=> {
                    return this.notifyMethodListeners(this, undefined, "get", [collectionName, objectId], session).then(()=> {
                        return obj;
                    });
                    // return obj;
                }).then((obj)=> {
                    var doc = obj ? this.serializer.toDocument(obj, true, true) : undefined;
                    return doc;
                });
            } else {
                throw new Error( "Not allowed" );
            }
        });
    }
    
    // converts parameters given to the web method from documents to objects
    private convertWebMethodParameters( args:Array<any>, classNames:Array<string>, session:omm.Session ){
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm.Reflect.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = this.retrieveObject(args[i], session);
                    else if (typeof args[i] == "object")
                        args[i] = this.serializer.toObject(args[i], cls);
                }
            }
        }
    }


}


