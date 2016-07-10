/**
 * Created by bert on 07.07.16.
 */

import * as omm from "../omm"
import * as wm from "@bvanheukelom/web-methods"

export class Client implements omm.Handler{

    private serializer:omm.Serializer;
    private webMethods:wm.WebMethods;
    private singletons:{ [index:string]: any } = {};

    constructor(host:string, port:number){
        if( !omm.MeteorPersistence.isInitialized() )
            throw new Error("omm is not initialized.");
        var endpointUrl = "http://"+host+":"+port+"/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);

        this.serializer = new omm.Serializer();
    }

    addSingleton( name:string, singleton:any ):void{
        this.singletons[name] = singleton;
        omm.SerializationPath.setObjectContext( singleton, undefined, this );
    }

    load<T>( cls:omm.TypeClass<T>, id:string ):Promise<T>{
        if( !omm.PersistenceAnnotation.isRootEntity(cls) ){
            throw new Error("Given class is not a root entity");
        }
        var className = omm.className(cls);
        return this.webMethods.call( "get", className, id ).then( (doc)=>{
            var o = this.serializer.toObject( doc, cls, this );
            // var collectionName = omm.PersistenceAnnotation.getCollectionName(cls);
            // var sp = new omm.SerializationPath( collectionName, id );
            omm.SerializationPath.updateObjectContexts( o, this );
            return o;
        });
    }

    call( methodName:string, objectId:string, args:any[]  ):Promise<any>{
        console.log( "Call web method "+methodName, objectId, args);

        // convert the arguments to their origin
        for (var i in args) {
            if (args[i]._serializationPath) {
                args[i] = args[i]._serializationPath.toString();
            }
            else if(typeof args[i]!="function") {

                args[i] = this.serializer.toDocument(args[i]);
            }
        }
        // prepend
        args.unshift( objectId );
        args.unshift( methodName );
        debugger;
        var p:Promise<any> = this.webMethods.call.apply(this.webMethods, args);
        return p.then((result:any)=>{
            console.log( "web method returned "+ result );
            // convert the result from json to an object
            if( result ) {
                var serializationPath = result.serializationPath;
                if( result.className ){
                    result = this.serializer.toObject(result);
                    if (serializationPath) {
                        omm.setNonEnumerableProperty(result, "_serializationPath", new omm.SerializationPath(serializationPath));
                        // we probably want to update the serialization paths for sub objects here
                    }
                }
            }
            return result;
        });
    }

    private getSingletonKey(o:any){
        for( var i in this.singletons ){
            if( this.singletons[i]==o )
                return i;
        }
        return undefined;
    }

    webMethod(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any{
        debugger;
        console.log("On the client, running webMethod:"+functionName);

        var sp:omm.SerializationPath = object._ommObjectContext.serializationPath ?  object._ommObjectContext.serializationPath : undefined;
        var key = this.getSingletonKey(object) || ( sp ? sp.toString() : undefined );
        var r:any;
        var options:omm.IMethodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);

        if( !options.serverOnly || !key ){
            console.log( "Running original function of web method "+options.name);
            r = originalFunction.apply(object, args);
        }
        if( key ) {
            r = this.call(options.name, key, args);
        }
        return r;
    }

    setUserData( ud:any ){

    }
}

// web method handler on the client side?

// patch the objects function to call the web method
// MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction, ...a:any[]) {
//
// });