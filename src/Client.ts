/**
 * Created by bert on 07.07.16.
 */

import * as omm from "./omm"
import * as wm from "@bvanheukelom/web-methods"
import * as eventemitter from "eventemitter2"

var jsd = require("jsondiffpatch");

export class Client implements omm.Handler{

    private serializer:omm.Serializer;
    private userData:any;
    private webMethods:wm.WebMethods;
    private singletons:{ [index:string]: any } = {};
    private eventEmitter:any;

    constructor(host:string, port:number ){
        // if( !omm.isInitialized() )
        //     throw new Error("omm is not initialized.");
        var endpointUrl = "http://"+host+":"+port+"/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new omm.Serializer();
        this.eventEmitter = new eventemitter.EventEmitter2();
    }

    /**
     * @deprecated
     */
    addSingleton( name:string, service:any ):void{
        this.registerService(name, service)
    }

    registerService( name:string, service:any ):void{
        this.singletons[name] = service;
        omm.SerializationPath.setObjectContext( service, undefined, this );
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
        return this.webMethods.call( "get", collectionName, id ).then( (result)=>{
            var document = result.document;
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

    webMethod(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any{
        if( this.webMethodRunning ) {
            console.log("Webmethod already running. Skipping, calling original function. Function name: "+functionName );
            return originalFunction.apply(object, args);
        }

        console.log("On the client, running webMethod:" + functionName);

        var sp:omm.SerializationPath = object._ommObjectContext.serializationPath ? object._ommObjectContext.serializationPath : undefined;
        var key = this.getSingletonKey(object) || ( sp ? sp.toString() : undefined );
        var r:any;
        var options:omm.IMethodOptions = omm.Reflect.getMethodOptions(entityClass, functionName);
        if (key) {
            r = this.call(options.name, key, args);
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
            omm.SerializationPath.updateObjectContexts(object, this);
        }

        return r;
    }

    setUserData( ud:any ){
        this.userData = ud;

    }

}