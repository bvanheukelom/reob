/**
 * Created by bert on 07.07.16.
 */

import * as omm from "../omm"
import * as wm from "@bvanheukelom/web-methods"
import * as Rx from "rx"
import { INetwork } from "./INetwork"
var jsd = require("jsondiffpatch");

export class Client implements omm.Handler{

    private serializer:omm.Serializer;
    private userData:any;
    private webMethods:wm.WebMethods;
    private singletons:{ [index:string]: any } = {};
    private network:INetwork;

    constructor(host:string, port:number, network?:INetwork){
        if( !omm.MeteorPersistence.isInitialized() )
            throw new Error("omm is not initialized.");
        var endpointUrl = "http://"+host+":"+port+"/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new omm.Serializer();
        this.network = network;
    }

    addSingleton( name:string, singleton:any ):void{
        this.singletons[name] = singleton;
        omm.SerializationPath.setObjectContext( singleton, undefined, this );
    }
    
    load<T>( clsOrString:omm.TypeClass<T>|string, id:string ):Promise<T>{
        var collectionName = clsOrString;
        if( typeof clsOrString!="string" )
            collectionName = omm.className(clsOrString);
        return this.webMethods.call( "get", collectionName, id ).then( (result)=>{
            var document = result.document;
            var serializationPath = new omm.SerializationPath(result.serializationPath);
            var className = result.className;
            var o = this.serializer.toObject( document,  this, omm.PersistenceAnnotation.getEntityClassByName(className), serializationPath );
            return o;
        });
    }

    loadDocument<T>( clsOrString:omm.TypeClass<T>|string, id:string ):Promise<T>{
        var collectionName = clsOrString;
        if( typeof clsOrString!="string" )
            collectionName = omm.className(clsOrString);
        return this.webMethods.call( "get", collectionName, id ).then( (result)=>{
            var document = result.document;
            // var serializationPath = new omm.SerializationPath(result.serializationPath);
            // var className = result.className;
            // var o = this.serializer.toObject( document,  this, omm.PersistenceAnnotation.getEntityClassByName(className), serializationPath );
            return document;
        });
    }

    private call( methodName:string, objectId:string, args:any[]  ):Promise<any>{
        console.log( "Call web method "+methodName, objectId, args);
        var webArgs = [];
        // convert the arguments to their origin
        for (var i in args) {
            if (args[i]._serializationPath) {
                webArgs[i] = args[i]._serializationPath.toString();
            }
            else if(typeof args[i]!="function") {
                webArgs[i] = this.serializer.toDocument(args[i]);
            }else{
                throw new Error( "There can not be parameters of type 'function' in the arguments when calling a web method with name "+methodName );
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
        });
    }

    private getSingletonKey(o:any){
        for( var i in this.singletons ){
            if( this.singletons[i]==o )
                return i;
        }
        return undefined;
    }

    static webMethodRunning:boolean = false;

    webMethod(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any{
        if( !Client.webMethodRunning ) {
            Client.webMethodRunning = true;
            try {
                console.log("On the client, running webMethod:" + functionName);

                var sp:omm.SerializationPath = object._ommObjectContext.serializationPath ? object._ommObjectContext.serializationPath : undefined;
                var key = this.getSingletonKey(object) || ( sp ? sp.toString() : undefined );
                var r:any;
                var options:omm.IMethodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
                if (key) {
                    r = this.call(options.name, key, args);
                }
                if (!options.serverOnly || !key) {
                    console.log("Running original function of web method " + options.name);
                    var rOriginal = originalFunction.apply(object, args);
                    if( !r )
                        r = rOriginal;
                    omm.SerializationPath.updateObjectContexts(object, this);
                }

                return r;
            }
            catch(e) {
                console.log( "Error running client side function for web method "+functionName+". ", e );
            }
            finally {
                Client.webMethodRunning = false;
            }
        }else{
            console.log("webmethod already running");
        }
    }

    setUserData( ud:any ){
        this.userData = ud;
    }
}

// web method handler on the client side?

// patch the objects function to call the web method
// MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction, ...a:any[]) {
//
// });