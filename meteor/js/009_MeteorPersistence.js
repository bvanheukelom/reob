///<reference path="references.d.ts"/>
persistence;
(function (persistence) {
    var MeteorPersistence = (function () {
        function MeteorPersistence() {
        }
        MeteorPersistence.init = function () {
            if (!MeteorPersistence.initialized) {
                persistence.PersistenceAnnotation.getEntityClasses().forEach(function (c) {
                    MeteorPersistence.wrapClass(c);
                });
                MeteorPersistence.initialized = true;
            }
        };
        MeteorPersistence.apply = function (o, fktName, args) {
            if (o.isWrapped) {
                if (o[fktName].originalFunction) {
                    return o[fktName].originalFunction.apply(o, args);
                }
            }
            else
                return o[fktName].apply(o, args);
        };
        MeteorPersistence.objectsClassName = function (o) {
            return persistence.PersistenceAnnotation.className(o.constructor);
        };
        MeteorPersistence.loadPath = function (s) {
            if (typeof s != "string")
                throw new Error("Path needs to be a string");
            var persistencePath = new persistence.PersistencePath(s);
            var typeClass = persistence.PersistenceAnnotation.getEntityClassByName(persistencePath.getClassName());
            if (!typeClass || typeof typeClass != "function")
                throw new Error("Could not load path. No class found for class name :" + persistencePath.getClassName() + ". Total path:" + s);
            var collectionName = persistence.PersistenceAnnotation.getCollectionName(typeClass);
            var collection = collectionName ? MeteorPersistence.collections[collectionName] : undefined;
            if (collection) {
                var rootValue = collection.getById(persistencePath.getId());
                var newValue = rootValue ? persistencePath.getSubObject(rootValue) : undefined;
                console.log("Lazy loading foreign key:" + s + " Loaded: ", newValue);
                return newValue;
            }
            else
                throw new Error("No collection found for lazy loading foreign key:" + s);
        };
        MeteorPersistence.withCallback = function (p, c) {
            MeteorPersistence.nextCallback = c;
            p();
            MeteorPersistence.nextCallback = undefined;
        };
        MeteorPersistence.wrapClass = function (c) {
            var className = persistence.PersistenceAnnotation.className(c);
            console.log("Wrapping transactional functions for class " + className);
            persistence.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var originalFunction = c.prototype[functionName];
                console.log("Wrapping transactional functions for class " + className + " function: " + functionName);
                var f = function meteorCallWrapper() {
                    var args = [];
                    var callback;
                    for (var i in arguments) {
                        if (i == arguments.length - 1 && typeof arguments[i] == "function")
                            callback = arguments[i];
                        else
                            args[i] = DeSerializer.Serializer.toDocument(arguments[i]);
                    }
                    if (this.persistencePath) {
                        console.log("Meteor call " + arguments.callee.functionName + " with arguments ", arguments, " path:", this.persistencePath + " registered callback:" + MeteorPersistence.nextCallback);
                        var typeNames = [];
                        for (var ai = 0; ai < args.length; ai++) {
                            typeNames.push(MeteorPersistence.objectsClassName(args[ai]));
                        }
                        Meteor.call("wrappedCall", this.persistencePath.toString(), arguments.callee.functionName, args, typeNames, !!callback, callback || MeteorPersistence.nextCallback);
                    }
                    if (callback) {
                        args.push(function (err, result) {
                        });
                    }
                    var result = arguments.callee.originalFunction.apply(this, args);
                    MeteorPersistence.updatePersistencePaths(this);
                    return result;
                };
                f.originalFunction = originalFunction;
                f.functionName = functionName;
                c.prototype[functionName] = f;
            });
            persistence.PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
                if (persistence.PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
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
                                    v = MeteorPersistence.loadPath(v);
                                    this[propertyName] = v;
                                }
                                else {
                                    for (var i in v) {
                                        var ele = v[i];
                                        v[i] = MeteorPersistence.loadPath(ele);
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
            var oc = persistence.PersistenceAnnotation.getClass(object);
            if (persistence.PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName)) {
                var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
                var shadowPropertyIsKeys = false;
                if (shadowpropertyDescriptor)
                    if (typeof object["_" + propertyName] == "string")
                        shadowPropertyIsKeys = true;
                    else if (persistence.PersistenceAnnotation.isArrayOrMap(oc, propertyName)) {
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
            if (!Object.getOwnPropertyDescriptor(object, "persistencePath")) {
                Object.defineProperty(object, "persistencePath", {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            visited.push(object);
            var objectClass = persistence.PersistenceAnnotation.getClass(object);
            if (persistence.PersistenceAnnotation.isRootEntity(objectClass)) {
                if (!object.persistencePath) {
                    if (object.getId && object.getId())
                        object.persistencePath = new persistence.PersistencePath(persistence.PersistenceAnnotation.getCollectionName(objectClass), object.getId());
                    else
                        throw new Error("Can not set the persistence path of root collection object without id. Class:" + persistence.PersistenceAnnotation.className(objectClass));
                }
            }
            else {
                if (!object.persistencePath)
                    throw new Error("Can not set the persistence path of non root collection object. " + persistence.PersistenceAnnotation.className(objectClass));
            }
            persistence.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
                if (!persistence.PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    var v = object[typedPropertyName];
                    if (v) {
                        if (persistence.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            for (var i in v) {
                                var e = v[i];
                                if (e.getId && e.getId()) {
                                    e.persistencePath = object.persistencePath.clone();
                                    e.persistencePath.appendArrayOrMapLookup(typedPropertyName, e.getId());
                                    MeteorPersistence.updatePersistencePaths(e, visited);
                                }
                                else
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + persistence.PersistenceAnnotation.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
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
                            if (persistence.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
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
        MeteorPersistence.classes = {};
        MeteorPersistence.collections = {};
        MeteorPersistence.wrappedCallInProgress = false;
        MeteorPersistence.initialized = false;
        return MeteorPersistence;
    })();
    persistence.MeteorPersistence = MeteorPersistence;
})(persistence || (persistence = {}));
Meteor.methods({
    wrappedCall: function (persistencePathString, functionName, args, typeNames, appendCallback) {
        // TODO authentication
        console.log("meteor method: wrappedCall arguments: ", arguments, typeNames);
        check(persistencePathString, String);
        check(functionName, String);
        check(args, Array);
        check(typeNames, Array);
        if (args.length != typeNames.length)
            throw new Error("array length does not match");
        var persistencePath = new persistence.PersistencePath(persistencePathString);
        for (var ai = 0; ai < args.length; ai++) {
            if (persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai])) {
                console.log("deserializing " + typeNames[ai]);
                args[ai] = DeSerializer.Serializer.toObject(args[ai], persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai]));
            }
        }
        var collection = persistence.MeteorPersistence.collections[persistencePath.getClassName()];
        try {
            persistence.MeteorPersistence.wrappedCallInProgress = true;
            return collection.update(persistencePath.getId(), function (o) {
                var subDocument = persistencePath.getSubObject(o);
                var fkt = subDocument ? subDocument[functionName] : undefined;
                if (fkt && fkt.originalFunction)
                    fkt = fkt.originalFunction;
                if (subDocument && fkt) {
                    console.log("Meteor method call. Function name:" + functionName + " function: ", fkt, " appendCallback: ", appendCallback);
                    if (appendCallback) {
                        console.log(" Meteor method call. Calling function with callback on ", subDocument);
                        var syncFunction = Meteor.wrapAsync(function (cb) {
                            args.push(cb);
                            fkt.apply(subDocument, args);
                        });
                        var result = syncFunction();
                        console.log("received async result from function ('" + functionName + "') invocation :" + result);
                        return result;
                    }
                    else {
                        console.log("Meteor method call. Calling function without callback");
                        return fkt.apply(subDocument, args);
                    }
                }
                else
                    console.log("did not find subdocument");
            });
        }
        finally {
            persistence.MeteorPersistence.wrappedCallInProgress = false;
        }
    }
});
