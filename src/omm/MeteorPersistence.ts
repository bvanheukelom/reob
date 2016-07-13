
import { SerializationPath } from "./SerializationPath"
import { OmmObject } from "./OmmObject"
import * as omm_annotation from "../annotations/PersistenceAnnotation"

import * as omm from "../omm"


export class MeteorPersistence {
    private static initialized = false;

    static init() {
        if (!MeteorPersistence.initialized) {

            // collection updates
            omm_annotation.PersistenceAnnotation.getEntityClasses().forEach(function (entityClass:omm_annotation.TypeClass<Object>) {
                //var className = omm_annotation.className(c);
                var that = this;
                omm_annotation.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function(functionName:string){
                    MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction, ...args:any[]) {
                        var _ommObjectContext:omm.ObjectContext = this._ommObjectContext;
                        if( !_ommObjectContext || !_ommObjectContext.handler ||!_ommObjectContext.handler.collectionUpdate ){
                            console.log("Collection update function "+functionName+". Calling original function. No handler found. ", args);
                            return originalFunction.apply(this, args);
                        }else{
                            console.log("collection update function "+functionName+". Calling handler. ", args);
                            return _ommObjectContext.handler.collectionUpdate(entityClass, functionName, this, originalFunction, args);
                        }
                    });
                });
            });
            
            // web methods
            omm_annotation.PersistenceAnnotation.getAllMethodFunctionNames().forEach((functionName:string)=>{
                var methodOptions:omm_annotation.IMethodOptions = omm_annotation.PersistenceAnnotation.getMethodOptions( functionName );
                console.log("Creating monkey patch for web method "+functionName, methodOptions.propertyName);
                MeteorPersistence.monkeyPatch(methodOptions.parentObject, methodOptions.propertyName, function (originalFunction, ...args:any[]) {
                    //console.log("updating object:",this, "original function :"+originalFunction);
                    var _ommObjectContext:omm.ObjectContext = this._ommObjectContext;
                    if( !_ommObjectContext || !_ommObjectContext.handler ||!_ommObjectContext.handler.webMethod  ){
                        console.log("web method function "+functionName+". Calling original function. No handler found.", args);
                        return originalFunction.apply(this, args);
                    }else{
                        console.log("web method function "+functionName+". Calling handler.", args);
                        return _ommObjectContext.handler.webMethod(omm.PersistenceAnnotation.getClass(this),functionName, this, originalFunction, args);
                    }
                });
            });


            MeteorPersistence.initialized = true;
        }
    }

    static isInitialized():boolean{
        return MeteorPersistence.initialized;
    }


    // TODO new name
    // static objectsClassName(o:any):string {
    //     return omm_annotation.className(o.constructor);
    // }

    getKey(object:OmmObject):string {
        if (object._ommObjectContext.serializationPath)
            return object._ommObjectContext.serializationPath.toString();
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


    // // todo  make the persistencePath enumerable:false everywhere it is set
    // private static getClassName(o:Object):string {
    //     if( typeof o =="object" && omm_annotation.PersistenceAnnotation.getClass( o )) {
    //         return omm_annotation.className( omm_annotation.PersistenceAnnotation.getClass( o ) );
    //     }
    //     else
    //         return typeof o;
    // }

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



export function init(){
    MeteorPersistence.init();
}


// export function startServer( mongoUrl:string, port:number ):Promise<any>{
//
//     return mongodb.MongoClient.connect( mongoUrl, {promiseLibrary:Promise}).then((db:mongodb.Db)=>{
//         MeteorPersistence.db = db;
//         MeteorPersistence.serverWebMethods = new wm.WebMethods("http://localhost:"+port+"/methods");
//         registerGetter(MeteorPersistence.serverWebMethods);
//         MeteorPersistence.init();
//         console.log("starting");
//         return MeteorPersistence.serverWebMethods.start(7000);
//     });
// }


