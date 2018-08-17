/**
 * Created by bert on 07.07.16.
 */

import { Object as ReobObject, Serializer, SerializationPath,  TypeClass, IMethodOptions} from "./reob"
import * as wm from "web-methods"
import * as eventemitter from "eventemitter2"
import {Handler} from "./Handler";
import {getClass, getClassName, getMethodOptions, getRemoteFunctionNames} from "./Annotations";



/**
 * This is class represents the startingpoint from the website. Use it to register services and load objects.
 */
export class Client implements Handler{

    /**
     * @hidden
     */
    private serializer:Serializer;
    private userData:any;
    private webMethods:wm.WebMethods;
    private singletons:{ [index:string]: any } = {};
    private eventEmitter:any;

    constructor( host:string, port:number ){
        // if( !omm.isInitialized() )
        //     throw new Error("omm is not initialized.");
        var endpointUrl = "http://"+host+":"+port+"/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new Serializer();
        this.eventEmitter = new eventemitter.EventEmitter2();
    }

    /**
     * Add a service to the client. After this you can call functions decorated with @remote so
     */
    addService( serviceName:string, service:Object ):void{
        // var serviceName = omm.getServiceName( omm.getClass(service) );
        // if( !serviceName ){
        //     console.log(service, omm.getClass(service));
        //     throw new Error("Registered service has no @Service(<name>) decorator." );
        // }
        this.singletons[serviceName] = service;

        var serviceClass = getClass(service);

        getRemoteFunctionNames(serviceClass).forEach((remoteFunctionName:string)=>{
            var options = getMethodOptions(serviceClass,remoteFunctionName);
            if( !options.name ) {
                options.name = serviceName + "." + options.propertyName;
            }
        });

        SerializationPath.setObjectContext( service, undefined, this, undefined );
    }

    /**
     * Load an object with a given id from a collection.
     */
    load<T>( collectionName:string, id:string ):Promise<T>{
        return this.loadDocument(collectionName, id).then((doc)=>{
            var o = this.serializer.toObject( doc,  this );
            return <T>o;
        });
    }

    /**
     * Load a document with a given id from a collection.
     */
    loadDocument<Document>( collectionName:string, id:string ):Promise<Document>{
        return this.webMethods.call( "get", collectionName, id, this.userData ).then( (document)=>{
            return document;
        });
    }

    /**
     * @hidden
     * @param methodName
     * @param objectId
     * @param args
     * @returns {Promise<T>|Promise<T|U>}
     */
    private call( methodName:string, objectId:string, args:any[]  ):Promise<any>{
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

    /**
     * Register listeners that are called whenever a network error happens.
     */
    onNetworkError(f:(e)=>void){
        this.eventEmitter.on("network-error", f);
    }

    /**
     * Remove listeners that are called whenever a network error happens.
     */
    removeNetworkErrorListener(f:(e)=>void){
        this.eventEmitter.removeListener("network-error", f);
    }

    /**
     * @hidden
     */
    private emitNetworkError( error ){
        this.eventEmitter.emit( "network-error", error );
    }

    /**
     * @hidden
     */
    private getSingletonKey(o:any){
        for( var i in this.singletons ){
            if( this.singletons[i]==o )
                return i;
        }
        return undefined;
    }

    /**
     * @hidden
     */
    private webMethodRunning:boolean = false;

    /**
     * @hidden
     */
    webMethod(entityClass:TypeClass<any>, functionName:string, object:ReobObject, originalFunction:Function, args:any[] ):any{
        if( this.webMethodRunning ) {
            return originalFunction.apply(object, args);
        }

        var objectContext = SerializationPath.getObjectContext( object );
        var sp:SerializationPath = objectContext.serializationPath ? objectContext.serializationPath : undefined;
        var serviceKey = this.getSingletonKey(object);
        var key = serviceKey || ( sp ? sp.toString() : undefined );
        var r:any;
        var options:IMethodOptions = getMethodOptions(entityClass, functionName);

        if (key) {
            var name = options.name;
            if( !name ){
                if( serviceKey )
                    name = serviceKey+"."+functionName;
                else
                    name = getClassName(entityClass)+"."+functionName;
            }
            r = this.call(name, key, args);
        }
        if (!options.serverOnly || !key) {
            var rOriginal;
            this.webMethodRunning = true;
            try{
                rOriginal = Promise.resolve(originalFunction.apply(object, args));
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
            SerializationPath.updateObjectContexts(object, this, undefined);
        }

        return r;
    }

    /**
     * Use this method to set any data that you'd like to use for authentication and authorization purposes on the server.
     * It is transmitted with every request.
     */
    setUserData( ud:any ){
        this.userData = ud;
    }

}

