/**
 * Created by bert on 07.07.16.
 */

import * as omm from "../omm"
import * as wm from "@bvanheukelom/web-methods"

export class Server{

    private collections:{ [index:string]: omm.Collection<any> } = {};
    private singletons:{ [index:string]: any } = {};
    private webMethods:wm.WebMethods;
    private serializer:omm.Serializer;

    constructor(express:any) {
        this.webMethods = new wm.WebMethods();
        this.serializer = new omm.Serializer();
        this.addAllWebMethods();
        this.registerGetter();

        this.webMethods.registerEndpoint(express);
    }

    addCollection( c: omm.Collection<any> ):void{
        this.collections[c.getName()] = c;
    }

    addSingleton( name:string, singleton:any ):void{
        this.singletons[name] = singleton;
        omm.SerializationPath.updateObjectContexts( singleton, this );
    }

    static userData:any;
    private addAllWebMethods():void {
        console.log("adding web methods " );
        omm.PersistenceAnnotation.getAllMethodFunctionNames().forEach((functionName:string)=>{
            var options:omm.IMethodOptions = omm.PersistenceAnnotation.getMethodOptions( functionName );
            console.log("Adding Web method " + options.name);
            this.webMethods.add(options.name, (...args:any[])=> {
                console.log("Web method " + options.name);

                // the object id is the first parameter
                var objectId = args.shift();

                // the user Data is the second parameter
                var userData = args.shift();
                console.log("User data ", userData);

                // convert parameters given to the web method from documents to objects
                this.convertWebMethodParameters(args, options.parameterTypes);

                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = this.retrieveObject(objectId)

                    // call function
                    .then((object:any)=> {
                        // this might be the collection update or another function that is called directly
                        Server.userData = userData;
                        var r =  object[options.propertyName].apply(object, args);
                        Server.userData = undefined;
                        return r;
                    })

                    // convert the result to a document
                    .then((result)=> {
                        var res:any = {};
                        if( result )
                            res.document = this.serializer.toDocument(result, true);
                        console.log("Result of web method " + options.name + " is ", res);
                        return res;
                    });

                // return the promise
                return p;
            });
        });
    }

    private retrieveObject( objectId:string ):Promise<any>{
        var singleton = this.singletons[objectId];
        if( singleton )
            return Promise.resolve(singleton);
        else{
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath( objectId );
            var collectionName = sPath.getCollectionName();
            var collection:omm.Collection<Object> = collectionName ? this.collections[collectionName] : undefined;
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
        var className = omm.className(o);
        if( className && omm.entityClasses[className] ){
            o.className = className;
        }
        if( o._serializationPath )
            o.serializationPath = o._serializationPath.toString();
    }
    
    registerGetter(){
        this.webMethods.add("get", (className:string, objectId:string)=>{
            console.log("Getter "+className, objectId );
            var type = omm.entityClasses[className];
            var collectionName  = type ? omm.PersistenceAnnotation.getCollectionName( type ) : undefined;
            var objPromise = collectionName ? this.retrieveObject(collectionName+"["+objectId+"]") : undefined;
            return objPromise.then((obj)=>{
                return obj ? this.serializer.toDocument(obj) : undefined;
            });
        });
    }
    
    // converts parameters given to the web method from documents to objects
    private convertWebMethodParameters( args:Array<any>, classNames:Array<string> ){
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = this.retrieveObject(args[i]);
                    else if (typeof args[i] == "object")
                        args[i] = this.serializer.toObject(args[i], cls);
                }
            }
        }
    }

}


