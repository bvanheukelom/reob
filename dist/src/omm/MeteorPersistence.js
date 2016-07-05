"use strict";
var Status_1 = require("./Status");
var Collection_1 = require("./Collection");
var Serializer_1 = require("../serializer/Serializer");
var SerializationPath_1 = require("./SerializationPath");
var omm_annotation = require("../annotations/PersistenceAnnotation");
var omm_event = require("../event/OmmEvent");
var mongodb = require("mongodb");
var wm = require("@bvanheukelom/web-methods");
var Promise = require("bluebird");
var CallHelper = (function () {
    function CallHelper(o, cb) {
        this.object = o;
        this.callback = cb;
    }
    return CallHelper;
}());
exports.CallHelper = CallHelper;
function registerObject(key, o) {
    omm_annotation.registeredObjects[key] = o;
}
exports.registerObject = registerObject;
function getRegisteredObject(key) {
    return omm_annotation.registeredObjects[key];
}
exports.getRegisteredObject = getRegisteredObject;
function call(methodName, objectId, args) {
    console.log("Call web method " + methodName, objectId, args);
    if (!MeteorPersistence.isInitialized())
        throw new Error("omm is not initialized.");
    // convert the arguments to their origin
    for (var i in args) {
        if (args[i]._serializationPath) {
            args[i] = args[i]._serializationPath.toString();
        }
        else if (typeof args[i] != "function") {
            args[i] = MeteorPersistence.serializer.toDocument(args[i]);
        }
    }
    // prepend
    args.unshift(objectId);
    args.unshift(methodName);
    var p = MeteorPersistence.clientWebMethods.call.apply(MeteorPersistence.clientWebMethods, args);
    return p.then(function (result) {
        // convert the result from json to an object
        if (result) {
            var serializationPath = result.serializationPath;
            if (result.className) {
                result = MeteorPersistence.serializer.toObject(result);
                if (serializationPath) {
                    omm_annotation.setNonEnumerableProperty(result, "_serializationPath", new SerializationPath_1.SerializationPath(serializationPath));
                }
            }
        }
        return result;
    });
}
var MeteorPersistence = (function () {
    function MeteorPersistence() {
    }
    MeteorPersistence.init = function () {
        if (!MeteorPersistence.initialized) {
            MeteorPersistence.serializer = new Serializer_1.default();
            // Serializer.init();
            omm_annotation.PersistenceAnnotation.getEntityClasses().forEach(function (c) {
                MeteorPersistence.wrapClass(c);
            });
            omm_annotation.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function (functionName) {
                var methodOptions = omm_annotation.PersistenceAnnotation.getMethodOptions(functionName);
                MeteorPersistence.createWebMethod(methodOptions);
            });
            MeteorPersistence.initialized = true;
        }
    };
    MeteorPersistence.isInitialized = function () {
        return MeteorPersistence.initialized;
    };
    MeteorPersistence.attachClassName = function (o) {
        var className = MeteorPersistence.getClassName(o);
        if (className && omm_annotation.entityClasses[className]) {
            o.className = className;
        }
        if (o._serializationPath)
            o.serializationPath = o._serializationPath.toString();
    };
    // TODO new name
    MeteorPersistence.objectsClassName = function (o) {
        return omm_annotation.className(o.constructor);
    };
    MeteorPersistence.prototype.getId = function (object) {
        if (object._serializationPath)
            return object._serializationPath.toString();
        else {
            var objectClass = omm_annotation.PersistenceAnnotation.getClass(object);
            var idPropertyName = omm_annotation.PersistenceAnnotation.getIdPropertyName(objectClass);
            var id = object[idPropertyName];
            if (omm_annotation.PersistenceAnnotation.isRootEntity(objectClass) && id) {
                return new SerializationPath_1.SerializationPath(omm_annotation.PersistenceAnnotation.getCollectionName(objectClass), id).toString();
            }
            else {
                throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
            }
        }
    };
    MeteorPersistence.retrieveObject = function (objectId) {
        var registeredObject = omm_annotation.registeredObjects[objectId];
        if (registeredObject)
            return Promise.resolve(registeredObject);
        else {
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new SerializationPath_1.SerializationPath(objectId);
            var collectionName = sPath.getCollectionName();
            var collection = collectionName ? Collection_1.default.getByName(collectionName) : undefined;
            if (collection) {
                return collection.getById(sPath.getId()).then(function (o) {
                    return sPath.getSubObject(o);
                });
            }
            else
                Promise.reject("No collection found to retrieve object. Key:" + objectId);
        }
    };
    // converts parameters given to the web method from documents to objects
    MeteorPersistence.convertWebMethodParameters = function (args, classNames) {
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm_annotation.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = MeteorPersistence.retrieveObject(args[i]);
                    else if (typeof args[i] == "object")
                        args[i] = MeteorPersistence.serializer.toObject(args[i], cls);
                }
            }
        }
    };
    MeteorPersistence.createWebMethod = function (options) {
        console.log("Creating web methods ", options.name);
        // patch the objects function to call the web method
        MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction) {
            var a = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                a[_i - 1] = arguments[_i];
            }
            console.log("Running replacer function of a function that is also a web method. Name:" + options.name);
            var key = omm_annotation.isRegisteredWithKey(this) || (this._serializationPath ? this._serializationPath.toString() : undefined);
            var r;
            var isServer = (this._serializationPath && !this._serializationPath.isClient);
            if (!options.serverOnly || isServer || !key) {
                console.log("Running original function of web method " + options.name);
                r = originalFunction.apply(this, a);
            }
            if (!isServer && key) {
                r = call(options.name, key, a);
            }
            return r;
        });
        // register the web method
        if (MeteorPersistence.serverWebMethods) {
            MeteorPersistence.serverWebMethods.add(options.name, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                console.log("Web method " + options.name);
                // the object id is the first parameter
                var objectId = args.shift();
                // convert parameters given to the web method from documents to objects
                MeteorPersistence.convertWebMethodParameters(args, options.parameterTypes);
                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = MeteorPersistence.retrieveObject(objectId)
                    .then(function (object) {
                    return object[options.name].originalFunction.apply(object, args);
                })
                    .then(function (result) {
                    MeteorPersistence.attachClassName(result);
                    var r = MeteorPersistence.serializer.toDocument(result);
                    console.log("Result of web method " + options.name + " is ", r);
                    return r;
                }).catch(function (e) {
                    console.log("Web method promise caught an exception:", e);
                });
                // return the promise
                return p;
            });
        }
    };
    /**
     * This patches the functions that are collection updates.
     * It also emits update events: pre:<FunctionName> post:<FunctionName>.
     * @param c
     */
    MeteorPersistence.wrapClass = function (entityClass) {
        //var className = omm_annotation.className(c);
        var that = this;
        omm_annotation.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function (functionName) {
            MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                //console.log("updating object:",this, "original function :"+originalFunction);
                var _serializationPath = this._serializationPath;
                if (!_serializationPath || _serializationPath.isClient) {
                    return originalFunction.apply(this, args);
                }
                var rootObject;
                var object;
                var collection;
                var objectPromise;
                var rootObjectPromise;
                // get the responsible collection
                collection = Collection_1.default.getByName(_serializationPath.getCollectionName());
                // load the object
                rootObjectPromise = collection.getById(_serializationPath.getId());
                objectPromise = rootObjectPromise.then(function (rootObject) {
                    return object = _serializationPath.getSubObject(rootObject);
                });
                return Promise.all([objectPromise, rootObjectPromise]).then(function (values) {
                    var object = values[0];
                    var rootObject = values[1];
                    // create the event context
                    var ctx = new omm_annotation.EventContext(object, collection);
                    ctx.methodContext = Status_1.default.methodContext;
                    ctx.functionName = functionName;
                    ctx.serializationPath = _serializationPath;
                    ctx.rootObject = rootObject;
                    // emit the pre-event
                    omm_event.callEventListeners(entityClass, "pre:" + functionName, ctx);
                    omm_event.callEventListeners(entityClass, "pre", ctx);
                    var preUpdateObject = object;
                    if (ctx.cancelledWithError()) {
                        return Promise.reject(ctx.cancelledWithError());
                    }
                    else {
                        var resultPromise = collection.update(object._serializationPath.getId(), function (o) {
                            var subObject = object._serializationPath.getSubObject(o);
                            var r2 = originalFunction.apply(subObject, args);
                            return r2;
                        });
                        // if( resetUpdateCollection ){
                        //     Status.updateInProgress = false;
                        // }
                        // TODO this might potentially catch updates of something that happened between the update and now. Small timeframe but still relevant. Also the extra load should be avoided.
                        console.log("events missing");
                        // if( updateCollection ){
                        //     rootObject = collection.getById(_serializationPath.getId());
                        //     object =_serializationPath.getSubObject(rootObject);
                        // }
                        //
                        // var ctx = new omm_annotation.EventContext( object, collection );
                        // ctx.preUpdate = preUpdateObject;
                        // ctx.methodContext = Status.methodContext;
                        // ctx.functionName = functionName;
                        // ctx.serializationPath = _serializationPath;
                        // ctx.rootObject = rootObject;
                        // //ctx.ob
                        //
                        // if( omm_event.getQueue() ){
                        //     omm_event.getQueue().forEach(function(t){
                        //         //console.log( 'emitting event:'+t.topic );
                        //         omm_event.callEventListeners( entityClass, t.topic, ctx, t.data );
                        //     });
                        // }
                        //
                        // omm_event.callEventListeners( entityClass, "post:"+functionName, ctx );
                        // omm_event.callEventListeners( entityClass, "post", ctx );
                        // if( resetUpdateCollection ){
                        //     omm_event.deleteQueue();
                        // }
                        return resultPromise;
                    }
                });
            });
        });
    };
    // todo  make the persistencePath enumerable:false everywhere it is set
    MeteorPersistence.getClassName = function (o) {
        if (typeof o == "object" && omm_annotation.PersistenceAnnotation.getClass(o)) {
            return omm_annotation.className(omm_annotation.PersistenceAnnotation.getClass(o));
        }
        else
            return typeof o;
    };
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
    MeteorPersistence.wrappedCallInProgress = false;
    MeteorPersistence.initialized = false;
    MeteorPersistence.webMethodInProgress = false;
    return MeteorPersistence;
}());
exports.MeteorPersistence = MeteorPersistence;
var endpointUrl;
function load(cls, id) {
    var webMethods = new wm.WebMethods(endpointUrl);
    var serializer = new Serializer_1.default();
    if (!omm_annotation.PersistenceAnnotation.isRootEntity(cls)) {
        throw new Error("Given class is not a root entity");
    }
    var className = omm_annotation.className(cls);
    return webMethods.call("get", className, id).then(function (doc) {
        var o = serializer.toObject(doc, cls);
        var collectionName = omm_annotation.PersistenceAnnotation.getCollectionName(cls);
        var sp = new SerializationPath_1.SerializationPath(collectionName, id);
        sp.isClient = true;
        SerializationPath_1.SerializationPath.setSerializationPath(o, sp);
        SerializationPath_1.SerializationPath.updateSerializationPaths(o);
        return o;
    });
}
exports.load = load;
function registerGetter(webMethods) {
    var serializer = new Serializer_1.default();
    webMethods.add("get", function (className, objectId) {
        console.log("Getter " + className, objectId);
        var type = omm_annotation.entityClasses[className];
        var collectionName = type ? omm_annotation.PersistenceAnnotation.getCollectionName(type) : undefined;
        var objPromise = collectionName ? MeteorPersistence.retrieveObject(collectionName + "[" + objectId + "]") : undefined;
        return objPromise.then(function (obj) {
            return obj ? serializer.toDocument(obj) : undefined;
        });
    });
}
function init(host, port) {
    endpointUrl = "http://" + host + ":" + port + "/methods";
    MeteorPersistence.clientWebMethods = new wm.WebMethods(endpointUrl);
    MeteorPersistence.init();
}
exports.init = init;
function startServer(mongoUrl, port) {
    return mongodb.MongoClient.connect(mongoUrl, { promiseLibrary: Promise }).then(function (db) {
        MeteorPersistence.db = db;
        MeteorPersistence.serverWebMethods = new wm.WebMethods("http://localhost:" + port + "/methods");
        registerGetter(MeteorPersistence.serverWebMethods);
        MeteorPersistence.init();
        console.log("starting");
        return MeteorPersistence.serverWebMethods.start(7000);
    });
}
exports.startServer = startServer;
//# sourceMappingURL=MeteorPersistence.js.map