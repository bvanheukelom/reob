/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>
PersistenceInfo = (function () {
    function PersistenceInfo() {
    }
    return PersistenceInfo;
})();
MeteorPersistence = (function () {
    function MeteorPersistence() {
    }
    MeteorPersistence.init = function () {
        if (!MeteorPersistence.initialized) {
            PersistenceAnnotation.getEntityClasses().forEach(function (c) {
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
    // TODO new name
    MeteorPersistence.objectsClassName = function (o) {
        return PersistenceAnnotation.className(o.constructor);
    };
    MeteorPersistence.wrapClass = function (c) {
        var className = PersistenceAnnotation.className(c);
        console.log("wrapping class " + className);
        // iterate over all properties of the prototype. this is where the functions are.
        PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
            var originalFunction = c.prototype[functionName];
            // replace the function with a wrapper function that either does a meteor call or call to the original
            console.log("Meteor wrapping function call: " + functionName + " on " + className);
            var f = function meteorCallWrapper() {
                // If this is object is part of persistence and no wrapped call is in progress ...
                if (!MeteorPersistence.wrappedCallInProgress && this.persistencePath) {
                    // hello meteor
                    console.log("Meteor call " + arguments.callee.functionName + " with arguments ", arguments, " path:", this.persistencePath);
                    var typeNames = [];
                    for (var ai = 0; ai < arguments.length; ai++) {
                        typeNames.push(MeteorPersistence.objectsClassName(arguments[ai]));
                    }
                    Meteor.call("wrappedCall", this.persistencePath.toString(), arguments.callee.functionName, arguments, typeNames);
                }
                // also call the method on the current object so that it reflects the update
                return arguments.callee.originalFunction.apply(this, arguments);
            };
            // this stores the old function on the wrapping one
            f.originalFunction = originalFunction;
            // this keeps the original method name accessible as the closure somehow cant access a loop iterator
            f.functionName = functionName;
            // set the wrapping function on the class
            c.prototype[functionName] = f;
        });
        PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
            console.log("lazy loader for " + propertyName, propertyDescriptor);
            var propertyDescriptor = Object.getOwnPropertyDescriptor(c.prototype, propertyName);
            Object.defineProperty(c.prototype, propertyName, {
                get: function () {
                    // TODO this doesnt work for subdocuments
                    //console.log("Monkey patched getter "+propertyName);
                    var v;
                    if (propertyDescriptor && propertyDescriptor.get)
                        v = propertyDescriptor.get.apply(this);
                    else
                        v = this["_" + propertyName];
                    var propertyClass = PersistenceAnnotation.getPropertyClass(c, propertyName);
                    var propertyClassName = propertyClass ? PersistenceAnnotation.className(propertyClass) : undefined;
                    var collection = propertyClassName ? MeteorPersistence.collections[propertyClassName] : undefined;
                    if (typeof v == "string") {
                        console.log("lazy loading " + v + " collection:", collection);
                        v = collection ? collection.getById(v) : undefined;
                        this[propertyName] = v;
                    }
                    else if (Array.isArray(v)) {
                        var arr = v;
                        if (arr.length > 0 && typeof arr[0] == "string") {
                            arr.forEach(function (ele, index) {
                                if (typeof ele != "string")
                                    throw new Error("There should be only ids in the array.");
                                arr[index] = collection.getById(ele);
                            });
                        }
                    }
                    //console.log("Monkey patched getter "+propertyName+" returns ",v);
                    return v;
                },
                set: function (v) {
                    //console.log("Monkey patched setter "+propertyName, arguments );
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
        });
    };
    MeteorPersistence.needsLazyLoading = function (object, propertyName) {
        // TODO inheritance
        var propertyDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
        var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
        return propertyDescriptor && shadowpropertyDescriptor && (typeof object["_" + propertyName] == "string");
    };
    MeteorPersistence.updatePersistencePaths = function (object) {
        var objectClass = PersistenceAnnotation.getClass(object);
        if (PersistenceAnnotation.isRootEntity(objectClass)) {
            if (!object.persistencePath) {
                if (object.getId && object.getId())
                    object.persistencePath = new PersistencePath(PersistenceAnnotation.className(objectClass), object.getId());
                else
                    throw new Error("Can not set the persistence path of root collection object without id.");
            }
        }
        else {
            if (!object.persistencePath)
                throw new Error("Can not set the persistence path of non root collection object.");
        }
        PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
            if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                var v = object[typedPropertyName];
                if (Array.isArray(v)) {
                    v.forEach(function (e) {
                        if (e.getId && e.getId()) {
                            e.persistencePath = object.persistencePath.clone();
                            e.persistencePath.appendPropertyLookup(typedPropertyName);
                            e.persistencePath.appendArrayLookup(e.getId());
                            MeteorPersistence.updatePersistencePaths(e);
                        }
                        else
                            throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + PersistenceAnnotation.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
                    });
                }
                else {
                    v.persistencePath = object.persistencePath.clone();
                    v.persistencePath.appendPropertyLookup(typedPropertyName);
                    MeteorPersistence.updatePersistencePaths(v);
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
Meteor.methods({
    wrappedCall: function (persistencePathString, functionName, args, typeNames) {
        // TODO authentication
        console.log("meteor method: wrappedCall arguments: ", arguments, typeNames);
        check(persistencePathString, String);
        check(functionName, String);
        check(args, Array);
        check(typeNames, Array);
        if (args.length != typeNames.length)
            throw new Error("array length does not match");
        debugger;
        var persistencePath = new PersistencePath(persistencePathString);
        for (var ai = 0; ai < args.length; ai++) {
            if (PersistenceAnnotation.getEntityClassByName(typeNames[ai])) {
                console.log("deserializing " + typeNames[ai]);
                args[ai] = Serializer.toObject(args[ai], PersistenceAnnotation.getEntityClassByName(typeNames[ai]));
            }
        }
        var collection = MeteorPersistence.collections[persistencePath.getClassName()];
        try {
            MeteorPersistence.wrappedCallInProgress = true;
            collection.update(persistencePath.getId(), function (o) {
                var subDocument = persistencePath.getSubObject(o);
                if (subDocument) {
                    var fkt = subDocument[functionName];
                    if (fkt && fkt.originalFunction)
                        fkt = fkt.originalFunction;
                    console.log("function: " + fkt);
                    console.log("type of: ", typeof o, "typeof ");
                    if (fkt)
                        return fkt.apply(o, args);
                }
                else
                    console.log("did not find subdocument");
            });
        }
        finally {
            MeteorPersistence.wrappedCallInProgress = false;
        }
    }
});
