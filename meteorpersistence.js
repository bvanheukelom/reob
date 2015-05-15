/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>
var persistence;
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
        // TODO new name
        MeteorPersistence.objectsClassName = function (o) {
            return persistence.PersistenceAnnotation.className(o.constructor);
        };
        //private static loadPath(s:string):Persistable {
        //    if (typeof s != "string")
        //        throw new Error("Path needs to be a string");
        //    var persistencePath = new persistence.PersistencePath(s);
        //    var typeClass:TypeClass<any> = persistence.PersistenceAnnotation.getEntityClassByName( persistencePath.getClassName() );
        //    if( !typeClass || typeof typeClass != "function" )
        //        throw new Error( "Could not load path. No class found for class name :"+ persistencePath.getClassName()+". Total path:"+s );
        //    var collectionName = persistence.PersistenceAnnotation.getCollectionName( typeClass );
        //    var collection:persistence.BaseCollection<Persistable> = collectionName ? MeteorPersistence.collections[collectionName] : undefined;
        //    if (collection) {
        //        var rootValue = collection.getById(persistencePath.getId());
        //        var newValue = rootValue ? persistencePath.getSubObject(rootValue) : undefined;
        //        console.log("Lazy loading foreign key:" + s + " Loaded: ", newValue);
        //        return newValue;
        //    }
        //    else
        //        throw new Error("No collection found for lazy loading foreign key:" + s);
        //}
        MeteorPersistence.withCallback = function (p, c) {
            MeteorPersistence.nextCallback = c;
            p();
            MeteorPersistence.nextCallback = undefined;
        };
        MeteorPersistence.wrapClass = function (c) {
            var className = persistence.PersistenceAnnotation.className(c);
            console.log("Wrapping transactional functions for class " + className);
            // iterate over all properties of the prototype. this is where the functions are.
            //var that = this;
            persistence.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                MeteorPersistence.wrapFunction(c.prototype, functionName, className + "." + functionName, false, MeteorPersistence.serializer, MeteorPersistence.meteorObjectRetriever);
                //var originalFunction:Function = <Function>c.prototype[functionName];
                //// replace the function with a wrapper function that either does a meteor call or call to the original
                //console.log("Wrapping transactional functions for class " + className + " function: " + functionName);
                //var f:any = function meteorCallWrapper() {
                //    var args = [];
                //    var callback;
                //    for( var i in arguments )
                //    {
                //        if( i==arguments.length-1 && typeof arguments[i]=="function" )
                //            callback = arguments[i];
                //        else
                //            args[i] = that.serializer.toDocument( arguments[i] );
                //    }
                //    // If this is object is part of persistence and no wrapped call is in progress ...
                //    if( this.persistencePath ) {
                //        // hello meteor
                //        console.log("Meteor call " + (<any>arguments).callee.functionName + " with arguments ", arguments, " path:", this.persistencePath+" registered callback:"+MeteorPersistence.nextCallback);
                //        var typeNames:Array<string> = [];
                //        for (var ai = 0; ai < args.length; ai++) {
                //            typeNames.push(MeteorPersistence.objectsClassName(args[ai]));
                //        }
                //        Meteor.call("wrappedCall", this.persistencePath.toString(), (<any>arguments).callee.functionName, args, typeNames, !!callback, callback || MeteorPersistence.nextCallback);
                //    }
                //    if( callback ) {
                //        args.push(function (err, result) {
                //
                //        });
                //    }
                //    // also call the method on the current object so that it reflects the update
                //    var result = (<any>arguments).callee.originalFunction.apply(this, args);
                //    MeteorPersistence.updatePersistencePaths(this);
                //    return result;
                //};
                //// this stores the old function on the wrapping one
                //f.originalFunction = originalFunction;
                //// this keeps the original method name accessible as the closure somehow cant access a loop iterator
                //f.functionName = functionName;
                //// set the wrapping function on the class
                //c.prototype[functionName] = f;
            });
            persistence.PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
                if (persistence.PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
                    //console.log("On Class " + className + ": creating lazy loader for " + propertyName);
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
                            if (MeteorPersistence.needsLazyLoading(this, propertyName)) {
                                if (typeof v == "string") {
                                    v = MeteorPersistence.meteorObjectRetriever.getObject(v);
                                    this[propertyName] = v;
                                }
                                else {
                                    //console.log("Lazy loading array/map " + className + "." + propertyName);
                                    for (var i in v) {
                                        var ele = v[i];
                                        v[i] = MeteorPersistence.meteorObjectRetriever.getObject(ele);
                                    }
                                }
                            }
                            //console.log("Monkey patched getter "+propertyName+" returns ",v);
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
            // TODO inheritance
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
        // todo  make the persistencePath enumerable:false everywhere it is set
        //static setPersistencePath(){
        //
        //}
        MeteorPersistence.updatePersistencePaths = function (object, visited) {
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            //console.log("updating persistence path for ", object)
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
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v = object[typedPropertyName];
                    if (v) {
                        if (persistence.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            //console.log("updating foreignkey property " + typedPropertyName + " is array");
                            for (var i in v) {
                                var e = v[i];
                                //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
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
                            //console.log("updating foreignkey property direct property " + typedPropertyName);
                            v.persistencePath = object.persistencePath.clone();
                            v.persistencePath.appendPropertyLookup(typedPropertyName);
                            MeteorPersistence.updatePersistencePaths(v, visited);
                        }
                    }
                }
                else {
                    //console.log( "foreign key "+typedPropertyName );
                    if (!MeteorPersistence.needsLazyLoading(object, typedPropertyName)) {
                        var v = object[typedPropertyName];
                        if (v) {
                            if (persistence.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e.persistencePath) {
                                        //console.log("non- foreign key array/map entry key:"+i+" value:"+e);
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
                        if (i == arguments.length - 1 && typeof arguments[i] == "function")
                            callback = originalArguments[i];
                        else {
                            args[i] = argumentSerializer ? argumentSerializer.toDocument(originalArguments[i]) : originalArguments[i];
                            classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                        }
                    }
                    var id = objectRetriever.getId(this);
                    // If this is object is part of persistence and no wrapped call is in progress ...
                    console.log("Meteor call " + propertyName + " with arguments ", originalArguments, " registered callback:" + MeteorPersistence.nextCallback);
                    Meteor.call(meteorMethodName, id, args, classNames, !!callback, callback || MeteorPersistence.nextCallback);
                    if (callback) {
                        args.push(function (err, result) {
                        });
                    }
                    // also call the method on the current object so that it reflects the update
                    var result = patchedFunction.apply(this, args);
                    return result;
                });
            }
            if (!serverOnly || Meteor.isServer) {
                Meteor.methods({
                    meteorMethodName: function (id, args, classNames, appendCallback) {
                        check(id, String);
                        check(args, Array);
                        check(classNames, Array);
                        try {
                            persistence.MeteorPersistence.wrappedCallInProgress = true;
                            var object = objectRetriever.getObject(id);
                            if (argumentSerializer) {
                                args.forEach(function (o, i) {
                                    var argumentClass = persistence.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                                    args[i] = argumentSerializer.toObject(o, argumentClass);
                                });
                            }
                            if (appendCallback) {
                                console.log(" Meteor method call. Calling function with callback on ", object);
                                var syncFunction = Meteor.wrapAsync(function (cb) {
                                    args.push(cb);
                                    originalFunction.apply(object, args);
                                });
                                var result = syncFunction();
                                console.log("received async result from function ('" + propertyName + "') invocation :" + result);
                                return result;
                            }
                            else {
                                console.log("Meteor method call. Calling function without callback");
                                return originalFunction.apply(object, args);
                            }
                        }
                        finally {
                            persistence.MeteorPersistence.wrappedCallInProgress = false;
                        }
                    }
                });
            }
        };
        MeteorPersistence.monkeyPatch = function (object, functionName, patchFunction) {
            var f = function monkeyPatchFunction() {
                var args = [];
                args.push(object[functionName]);
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
        MeteorPersistence.meteorObjectRetriever = new MeteorObjectRetriever();
        MeteorPersistence.serializer = new DeSerializer.Serializer(MeteorPersistence.meteorObjectRetriever);
        return MeteorPersistence;
    })();
    persistence.MeteorPersistence = MeteorPersistence;
})(persistence || (persistence = {}));
//Meteor.methods({
//    wrappedCall:function( persistencePathString:string, functionName:string, args:Array<any>, typeNames:Array<string>, appendCallback:boolean )
//    {
//        // TODO authentication
//
//        console.log("meteor method: wrappedCall arguments: ", arguments, typeNames );
//        check(persistencePathString,String);
//        check(functionName, String);
//        check(args, Array);
//        check(typeNames, Array);
//        if( args.length!=typeNames.length )
//            throw new Error("array length does not match");
//
//        var persistencePath = new persistence.PersistencePath(persistencePathString);
//        for( var ai = 0; ai<args.length; ai++ )
//        {
//            if( persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) )
//            {
//                console.log("deserializing "+typeNames[ai] );
//                args[ai] = DeSerializer.Serializer.toObject(args[ai], persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) );
//            }
//        }
//        var collection:persistence.BaseCollection<any> = persistence.MeteorPersistence.collections[persistencePath.getClassName()];
//        try
//        {
//            persistence.MeteorPersistence.wrappedCallInProgress = true;
//            return collection.update( persistencePath.getId(), function( o ){
//                var subDocument:any = persistencePath.getSubObject( o );
//                var fkt = subDocument? subDocument[functionName]:undefined;
//                if (fkt && fkt.originalFunction)
//                    fkt = fkt.originalFunction;
//                if( subDocument && fkt )
//                {
//                    console.log("Meteor method call. Function name:"+functionName+" function: ",fkt, " appendCallback: ", appendCallback);
//
//                    if( appendCallback )
//                    {
//                        console.log(" Meteor method call. Calling function with callback on ",subDocument );
//                        var syncFunction = Meteor.wrapAsync(function(cb){
//                            args.push(cb);
//                            fkt.apply(subDocument, args);
//                        });
//                        var result = syncFunction();
//                        console.log("received async result from function ('"+functionName+"') invocation :"+result );
//                        return result;
//                    }
//                    else
//                    {
//                        console.log("Meteor method call. Calling function without callback" );
//                        return fkt.apply(subDocument, args);
//                    }
//                }
//                else
//                    console.log("did not find subdocument");
//            } );
//
//        }
//        finally
//        {
//            persistence.MeteorPersistence.wrappedCallInProgress = false;
//        }
//    }
//});
//# sourceMappingURL=MeteorPersistence.js.map