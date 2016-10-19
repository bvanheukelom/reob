/**
 * Created by bert on 07.07.16.
 */

import * as reob from "./reob"
import * as wm from "web-methods"
import * as eventemitter from "eventemitter2"

var jsd = require("jsondiffpatch");

export class Client implements reob.Handler{

    private serializer:reob.Serializer;
    private userData:any;
    private webMethods:wm.WebMethods;
    private singletons:{ [index:string]: any } = {};
    private eventEmitter:any;

    constructor(host:string, port:number ){
        // if( !omm.isInitialized() )
        //     throw new Error("omm is not initialized.");
        var endpointUrl = "http://"+host+":"+port+"/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new reob.Serializer();
        this.eventEmitter = new eventemitter.EventEmitter2();
    }

    addService( serviceName:string, service:Object ):void{
        // var serviceName = omm.Reflect.getServiceName( omm.Reflect.getClass(service) );
        // if( !serviceName ){
        //     console.log(service, omm.Reflect.getClass(service));
        //     throw new Error("Registered service has no @Service(<name>) decorator." );
        // }
        this.singletons[serviceName] = service;

        var serviceClass = reob.Reflect.getClass(service);

        reob.Reflect.getRemoteFunctionNames(serviceClass).forEach((remoteFunctionName:string)=>{
            var options = reob.Reflect.getMethodOptions(serviceClass,remoteFunctionName);
            if( !options.name ) {
                options.name = serviceName + "." + options.propertyName;
            }
        });

        reob.SerializationPath.setObjectContext( service, undefined, this, undefined );
    }

    load<T>( collectionName:string, id:string ):Promise<T>{
        return this.loadDocument(collectionName, id).then((doc)=>{
            console.log("Client loaded :",doc);
            var o = this.serializer.toObject( doc,  this );
            console.log("Client returned ",o);
            return <T>o;
        });
    }

    loadDocument<Document>( collectionName:string, id:string ):Promise<Document>{
        return this.webMethods.call( "get", collectionName, id, this.userData ).then( (document)=>{
            return document;
        });
    }

    private call( methodName:string, objectId:string, args:any[]  ):Promise<any>{
        console.log( "Call web method "+methodName, objectId, args);
        var webArgs = [];
        // convert the arguments to their origin
        for (var i in args) {
            if( args[i] ) {
                if (args[i]._serializationPath) {
                    webArgs[i] = args[i]._serializationPath.toString();
                }
                else if (typeof args[i] != "function") {
                    webArgs[i] = this.serializer.toDocument(args[i]);
                } else {
                    throw new Error("There can not be parameters of type 'function' in the arguments when calling a web method with name " + methodName);
                }
            }
            else{
                webArgs[i] = args[i];
            }
        }
        // prepend
        webArgs.unshift( this.userData );
        webArgs.unshift( objectId );
        webArgs.unshift( methodName );

        var p:Promise<any> = this.webMethods.call.apply(this.webMethods, webArgs);
        return p.then((result:any)=>{
            console.log( "web method returned ", result );
            // convert the result from json to an object
            var obje;
            if( result ) {
                obje = this.serializer.toObject(result.document, this );
            }
            return obje;
        }).catch((reason)=>{
            if( reason.message=="XHR error" ){
                var e = new Error("Network error");
                this.emitNetworkError(e);
                throw e;
            }else
                throw reason;
        });
    }

    onNetworkError(f:(e)=>void){
        this.eventEmitter.on("network-error", f);
    }

    removeNetworkErrorListener(f:(e)=>void){
        this.eventEmitter.removeListener("network-error", f);
    }

    private emitNetworkError( error ){
        this.eventEmitter.emit( "network-error", error );
    }

    private getSingletonKey(o:any){
        for( var i in this.singletons ){
            if( this.singletons[i]==o )
                return i;
        }
        return undefined;
    }

    webMethodRunning:boolean = false;

    webMethod(entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[] ):any{
        if( this.webMethodRunning ) {
            console.log("Webmethod already running. Skipping, calling original function. Function name: "+functionName );
            return originalFunction.apply(object, args);
        }

        var objectContext = reob.SerializationPath.getObjectContext( object );
        var sp:reob.SerializationPath = objectContext.serializationPath ? objectContext.serializationPath : undefined;
        var serviceKey = this.getSingletonKey(object);
        var key = serviceKey || ( sp ? sp.toString() : undefined );
        var r:any;
        var options:reob.IMethodOptions = reob.Reflect.getMethodOptions(entityClass, functionName);

        console.log("On the client, running webMethod:" + functionName, "Service key:",serviceKey);


        if (key) {
            var name = options.name;
            if( !name ){
                if( serviceKey )
                    name = serviceKey+"."+functionName;
                else
                    name = reob.Reflect.getClassName(entityClass)+"."+functionName;
            }
            r = this.call(name, key, args);
        }
        if (!options.serverOnly || !key) {
            console.log("Running original function of web method " + options.name);
            var rOriginal;
            this.webMethodRunning = true;
            try{
                rOriginal = Promise.cast(originalFunction.apply(object, args));
            }catch(error){
                rOriginal = Promise.reject(error);
            } finally {
                this.webMethodRunning= false;
            }
            if( !r )
                r = rOriginal;
            else{
                rOriginal.catch(()=>{
                    // hide exception, as the result is coming from the server
                });
            }
            reob.SerializationPath.updateObjectContexts(object, this, undefined);
        }

        return r;
    }

    setUserData( ud:any ){
        this.userData = ud;

    }

}