"use strict";
var omm_annotation = require("../annotations/PersistenceAnnotation");
var omm = require("../omm");
var MeteorPersistence = (function () {
    function MeteorPersistence() {
    }
    MeteorPersistence.init = function () {
        if (!MeteorPersistence.initialized) {
            // collection updates
            omm_annotation.PersistenceAnnotation.getEntityClasses().forEach(function (entityClass) {
                //var className = omm_annotation.className(c);
                var that = this;
                omm_annotation.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function (functionName) {
                    MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        var _ommObjectContext = this._ommObjectContext;
                        if (!_ommObjectContext || !_ommObjectContext.handler || !_ommObjectContext.handler.collectionUpdate) {
                            console.log(new Date() + ": CollectionUpdate called. Function " + functionName + ". Calling original function. No handler found. ", args);
                            return originalFunction.apply(this, args);
                        }
                        else {
                            console.log(new Date() + ": CollectionUpdate called. Function " + functionName + ". Calling handler. ", args);
                            return _ommObjectContext.handler.collectionUpdate(entityClass, functionName, this, originalFunction, args);
                        }
                    });
                });
            });
            // web methods
            omm_annotation.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function (functionName) {
                var methodOptions = omm_annotation.PersistenceAnnotation.getMethodOptions(functionName);
                console.log("Creating monkey patch for web method " + functionName, methodOptions.propertyName);
                MeteorPersistence.monkeyPatch(methodOptions.parentObject, methodOptions.propertyName, function (originalFunction) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    //console.log("updating object:",this, "original function :"+originalFunction);
                    var _ommObjectContext = this._ommObjectContext;
                    if (!_ommObjectContext || !_ommObjectContext.handler || !_ommObjectContext.handler.webMethod) {
                        console.log(new Date() + ": WebMethod called. Function " + functionName + ". Calling original function. No handler found.", args);
                        return originalFunction.apply(this, args);
                    }
                    else {
                        console.log(new Date() + ": WebMethod called. Function " + functionName + ". Calling handler.", args);
                        return _ommObjectContext.handler.webMethod(omm.PersistenceAnnotation.getClass(this), functionName, this, originalFunction, args);
                    }
                });
            });
            MeteorPersistence.initialized = true;
        }
    };
    MeteorPersistence.isInitialized = function () {
        return MeteorPersistence.initialized;
    };
    // TODO new name
    // static objectsClassName(o:any):string {
    //     return omm_annotation.className(o.constructor);
    // }
    // getKey(object:OmmObject):string {
    //     if (object._ommObjectContext.serializationPath)
    //         return object._ommObjectContext.serializationPath.toString();
    //     else {
    //         var objectClass = omm_annotation.PersistenceAnnotation.getClass(object);
    //         var idPropertyName = omm_annotation.PersistenceAnnotation.getIdPropertyName(objectClass);
    //         var id = object[idPropertyName];
    //         if (omm_annotation.PersistenceAnnotation.isRootEntity(objectClass) && id) {
    //             return new SerializationPath( omm_annotation.PersistenceAnnotation.getCollectionName(objectClass), id).toString();
    //         }
    //         else {
    //             throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
    //         }
    //     }
    // }
    // // todo  make the persistencePath enumerable:false everywhere it is set
    // private static getClassName(o:Object):string {
    //     if( typeof o =="object" && omm_annotation.PersistenceAnnotation.getClass( o )) {
    //         return omm_annotation.className( omm_annotation.PersistenceAnnotation.getClass( o ) );
    //     }
    //     else
    //         return typeof o;
    // }
    MeteorPersistence.monkeyPatch = function (object, functionName, patchFunction) {
        var originalFunction = object[functionName];
        object[functionName] = function monkeyPatchFunction() {
            var args = [];
            args.push(originalFunction);
            for (var i in arguments) {
                args.push(arguments[i]);
            }
            return patchFunction.apply(this, args);
        };
        object[functionName].originalFunction = originalFunction;
    };
    MeteorPersistence.initialized = false;
    return MeteorPersistence;
}());
exports.MeteorPersistence = MeteorPersistence;
var endpointUrl;
function init() {
    MeteorPersistence.init();
}
exports.init = init;
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
//# sourceMappingURL=MeteorPersistence.js.map