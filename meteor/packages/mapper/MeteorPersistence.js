///<reference path="./references.d.ts"/>
mapper;
(function (mapper) {
    var MeteorPersistence = (function () {
        function MeteorPersistence() {
        }
        MeteorPersistence.init = function () {
            if (!MeteorPersistence.initialized) {
                mapper.PersistenceAnnotation.getEntityClasses().forEach(function (c) {
                    MeteorPersistence.wrapClass(c);
                });
                MeteorPersistence.initialized = true;
            }
        };
        MeteorPersistence.objectsClassName = function (o) {
            return mapper.className(o.constructor);
        };
        MeteorPersistence.withCallback = function (p, c) {
            if (Meteor.isClient) {
                MeteorPersistence.nextCallback = c;
                p();
            }
            else
                throw new Error("'withCallback' only works on the client as it is called when the next wrapped meteor call returns");
        };
        MeteorPersistence.wrapClass = function (c) {
            var className = mapper.className(c);
            console.log("Wrapping transactional functions for class " + className);
            mapper.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var domainObjectFunction = c.prototype[functionName];
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    var collection = mapper.MeteorPersistence.collections[mapper.PersistenceAnnotation.getCollectionName(c)];
                    if (MeteorPersistence.wrappedCallInProgress || Meteor.isServer) {
                        return collection.update(this.getId(), function (o) {
                            return originalFunction.apply(o, args);
                        });
                    }
                    else
                        return originalFunction.apply(this, args);
                });
                MeteorPersistence.wrapFunction(c.prototype, functionName, className + "." + functionName, false, MeteorPersistence.serializer, MeteorPersistence.meteorObjectRetriever);
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (this.persistencePath) {
                        originalFunction.apply(this, args);
                    }
                    else
                        domainObjectFunction.apply(this, args);
                });
            });
            mapper.PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
                if (mapper.PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
                    var propertyDescriptor = Object.getOwnPropertyDescriptor(c.prototype, propertyName);
                    Object.defineProperty(c.prototype, propertyName, {
                        get: function () {
                            var v;
                            if (propertyDescriptor && propertyDescriptor.get)
                                v = propertyDescriptor.get.apply(this);
                            else
                                v = this["_" + propertyName];
                            if (MeteorPersistence.needsLazyLoading(this, propertyName)) {
                                if (typeof v == "string") {
                                    v = MeteorPersistence.meteorObjectRetriever.getObject(v);
                                    this[propertyName] = v;
                                }
                                else {
                                    for (var i in v) {
                                        var ele = v[i];
                                        v[i] = MeteorPersistence.meteorObjectRetriever.getObject(ele);
                                    }
                                }
                            }
                            return v;
                        },
                        set: function (v) {
                            //console.log("Monkey patched setter " + propertyName + " v:" + v);
                            if (propertyDescriptor && propertyDescriptor.set)
                                propertyDescriptor.set.apply(this, arguments);
                            else {
                                if (!Object.getOwnPropertyDescriptor(this, "_" + propertyName)) {
                                    Object.defineProperty(this, "_" + propertyName, {
                                        configurable: false,
                                        enumerable: false,
                                        writable: true
                                    });
                                }
                                this["_" + propertyName] = v;
                            }
                        },
                        configurable: propertyDescriptor ? propertyDescriptor.configurable : true,
                        enumerable: propertyDescriptor ? propertyDescriptor.enumerable : true
                    });
                }
                else
                    console.log("On Class " + className + ": no lazy loader for " + propertyName);
            });
        };
        MeteorPersistence.needsLazyLoading = function (object, propertyName) {
            var oc = mapper.PersistenceAnnotation.getClass(object);
            if (mapper.PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName)) {
                var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
                var shadowPropertyIsKeys = false;
                if (shadowpropertyDescriptor)
                    if (typeof object["_" + propertyName] == "string")
                        shadowPropertyIsKeys = true;
                    else if (mapper.PersistenceAnnotation.isArrayOrMap(oc, propertyName)) {
                        var v = object["_" + propertyName];
                        for (var i in v) {
                            if (typeof v[i] == "string")
                                shadowPropertyIsKeys = true;
                            break;
                        }
                    }
                return shadowPropertyIsKeys;
            }
            else
                return false;
        };
        MeteorPersistence.updatePersistencePaths = function (object, visited) {
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            if (!object || typeof object != "object")
                return;
            if (!Object.getOwnPropertyDescriptor(object, "persistencePath")) {
                Object.defineProperty(object, "persistencePath", {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            visited.push(object);
            var objectClass = mapper.PersistenceAnnotation.getClass(object);
            if (mapper.PersistenceAnnotation.isRootEntity(objectClass)) {
                if (!object.persistencePath) {
                    if (object.getId())
                        object.persistencePath = new mapper.PersistencePath(mapper.PersistenceAnnotation.getCollectionName(objectClass), object.getId());
                    else
                        throw new Error("Can not set the persistence path of root collection object without id. Class:" + mapper.className(objectClass));
                }
            }
            else {
                if (!object.persistencePath)
                    throw new Error("Can not set the persistence path of non root collection object. " + mapper.className(objectClass));
            }
            mapper.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
                if (!mapper.PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    var v = object[typedPropertyName];
                    if (v) {
                        if (mapper.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            for (var i in v) {
                                var e = v[i];
                                if (e.getId && e.getId()) {
                                    e.persistencePath = object.persistencePath.clone();
                                    e.persistencePath.appendArrayOrMapLookup(typedPropertyName, e.getId());
                                    MeteorPersistence.updatePersistencePaths(e, visited);
                                }
                                else
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + mapper.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
                            }
                        }
                        else {
                            v.persistencePath = object.persistencePath.clone();
                            v.persistencePath.appendPropertyLookup(typedPropertyName);
                            MeteorPersistence.updatePersistencePaths(v, visited);
                        }
                    }
                }
                else {
                    if (!MeteorPersistence.needsLazyLoading(object, typedPropertyName)) {
                        var v = object[typedPropertyName];
                        if (v) {
                            if (mapper.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e.persistencePath) {
                                        MeteorPersistence.updatePersistencePaths(e, visited);
                                    }
                                }
                            }
                            else if (!v.persistencePath)
                                MeteorPersistence.updatePersistencePaths(v, visited);
                        }
                    }
                }
            });
        };
        MeteorPersistence.wrapFunction = function (object, propertyName, meteorMethodName, serverOnly, argumentSerializer, objectRetriever) {
            var originalFunction = object[propertyName];
            if (Meteor.isClient) {
                MeteorPersistence.monkeyPatch(object, propertyName, function (patchedFunction) {
                    var originalArguments = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        originalArguments[_i - 1] = arguments[_i];
                    }
                    var args = [];
                    var classNames = [];
                    var callback;
                    for (var i in originalArguments) {
                        if (i == originalArguments.length - 1 && typeof originalArguments[i] == "function")
                            callback = originalArguments[i];
                        else if (originalArguments[i].persistencePath) {
                            args[i] = originalArguments[i].persistencePath.toString();
                            classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                        }
                        else if (argumentSerializer) {
                            args[i] = argumentSerializer ? argumentSerializer.toDocument(originalArguments[i]) : originalArguments[i];
                            classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                        }
                        else {
                            args[i] = originalArguments[i];
                        }
                    }
                    var id = objectRetriever.getId(this);
                    console.log("Meteor call " + propertyName + " with arguments ", originalArguments, " registered callback:" + MeteorPersistence.nextCallback);
                    Meteor.call(meteorMethodName, id, args, classNames, !!callback, function (error, result) {
                        console.log("Returned from meteor method '" + meteorMethodName + "' with result:", result, "_", callback, "_", MeteorPersistence.nextCallback);
                        if (!error) {
                            if (argumentSerializer && result.className) {
                                result.result = argumentSerializer.toObject(result.result, mapper.PersistenceAnnotation.getEntityClassByName(result.className));
                                MeteorPersistence.updatePersistencePaths(result.result);
                            }
                        }
                        if (callback)
                            callback(error, result ? result.result : undefined);
                        else if (MeteorPersistence.nextCallback) {
                            MeteorPersistence.nextCallback(error, result ? result.result : undefined);
                            MeteorPersistence.nextCallback = undefined;
                        }
                    });
                });
            }
            if (!serverOnly || Meteor.isServer) {
                var m = {};
                m[meteorMethodName] = function (id, args, classNames, appendCallback) {
                    check(id, String);
                    check(args, Array);
                    check(classNames, Array);
                    console.log("Meteor method invoked: " + meteorMethodName + " id:" + id + " appendCallback:" + appendCallback + " args:", args, " classNames:" + classNames);
                    mapper.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object = objectRetriever.getObject(id);
                        if (!object)
                            throw new Error("Unable to retrieve object with id: " + id);
                        if (argumentSerializer) {
                            args.forEach(function (o, i) {
                                var argumentClass = mapper.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                                if (argumentClass) {
                                    if (typeof o == "string")
                                        args[i] = argumentSerializer.objectRetriever.getObject(o);
                                    else
                                        args[i] = argumentSerializer.toObject(o, argumentClass);
                                }
                            });
                        }
                        var resultObj = {};
                        if (appendCallback) {
                            console.log(" Meteor method call. Calling function with callback on ", object);
                            var syncFunction = Meteor.wrapAsync(function (cb) {
                                args.push(cb);
                                originalFunction.apply(object, args);
                            });
                            resultObj.result = syncFunction();
                        }
                        else {
                            console.log("Meteor method call. Calling function without callback");
                            resultObj.result = originalFunction.apply(object, args);
                        }
                        if (argumentSerializer)
                            resultObj.className = argumentSerializer.getClassName(resultObj.result);
                        console.log("Returning from meteor method '" + meteorMethodName + "' with result:", resultObj);
                        return resultObj;
                    }
                    finally {
                        mapper.MeteorPersistence.wrappedCallInProgress = false;
                    }
                };
                Meteor.methods(m);
            }
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
        };
        MeteorPersistence.classes = {};
        MeteorPersistence.collections = {};
        MeteorPersistence.wrappedCallInProgress = false;
        MeteorPersistence.initialized = false;
        MeteorPersistence.meteorObjectRetriever = new mapper.MeteorObjectRetriever();
        MeteorPersistence.serializer = new DeSerializer.Serializer(MeteorPersistence.meteorObjectRetriever);
        return MeteorPersistence;
    })();
    mapper.MeteorPersistence = MeteorPersistence;
})(mapper || (mapper = {}));
//# sourceMappingURL=MeteorPersistence.js.map
