///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var BaseCollection = (function () {
        function BaseCollection(persistableClass) {
            this.serializer = new DeSerializer.Serializer(new mapper.MeteorObjectRetriever());
            var collectionName = mapper.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if (!mapper.MeteorPersistence.collections[collectionName]) {
                // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
                mapper.MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }
        BaseCollection.getCollection = function (t) {
            return mapper.MeteorPersistence.collections[mapper.PersistenceAnnotation.getCollectionName(t)];
        };
        BaseCollection._getMeteorCollection = function (name) {
            if (!BaseCollection.meteorCollections[name]) {
                if (name != "users") {
                    BaseCollection.meteorCollections[name] = new Meteor.Collection(name);
                }
                else
                    BaseCollection.meteorCollections[name] = Meteor.users;
            }
            return BaseCollection.meteorCollections[name];
        };
        BaseCollection.prototype.getName = function () {
            return this.name;
        };
        BaseCollection.prototype.getMeteorCollection = function () {
            return this.meteorCollection;
        };
        BaseCollection.prototype.getById = function (id) {
            var o = this.find({
                "_id": id
            });
            return o.length > 0 ? o[0] : undefined;
        };
        BaseCollection.prototype.find = function (findCriteria) {
            var documents = this.meteorCollection.find(findCriteria).fetch();
            var objects = [];
            for (var i = 0; i < documents.length; i++) {
                var document = documents[i];
                objects[i] = this.documentToObject(document);
            }
            return objects;
        };
        BaseCollection.prototype.getAll = function () {
            return this.find({});
        };
        BaseCollection.prototype.remove = function (id, cb) {
            if (Meteor.isServer) {
                if (id) {
                    this.meteorCollection.remove(id, cb);
                }
                else
                    throw new Error("Trying to remove an object that does not have an id.");
            }
            else
                throw new Error("Trying to remove an object from the client. 'remove' can only be called on the server.");
        };
        BaseCollection.prototype.documentToObject = function (doc) {
            var p = this.serializer.toObject(doc, this.theClass);
            mapper.MeteorPersistence.updatePersistencePaths(p);
            return p;
        };
        BaseCollection.prototype.update = function (id, updateFunction) {
            if (!id)
                throw new Error("Id missing");
            for (var i = 0; i < 10; i++) {
                var document = this.meteorCollection.findOne({
                    _id: id
                });
                if (!document)
                    return undefined;
                var currentSerial = document.serial;
                // call the update function
                var object = this.documentToObject(document);
                var result = updateFunction(object);
                mapper.MeteorPersistence.updatePersistencePaths(object);
                var documentToSave = this.serializer.toDocument(object);
                documentToSave.serial = currentSerial + 1;
                // update the collection
                console.log("writing document ", documentToSave);
                var updatedDocumentCount = this.meteorCollection.update({
                    _id: id,
                    serial: currentSerial
                }, documentToSave);
                // verify that that went well
                if (updatedDocumentCount == 1) {
                    return result; // we're done
                }
                else if (updatedDocumentCount > 1)
                    throw new Meteor.Error("verifiedUpdate should only update one document");
                else {
                    console.log("rerunning verified update ");
                }
            }
            throw new Error("update gave up after 10 attempts to update the object ");
        };
        BaseCollection.prototype.insert = function (p, callback) {
            if (Meteor.isServer) {
                // TODO make sure that this is unique
                if (typeof p.getId != "function" || !p.getId())
                    p.setId(new Mongo.ObjectID()._str);
                var doc = this.serializer.toDocument(p);
                //if( typeof p.getId=="function" && p.getId() )
                //    doc._id = p.getId();
                //else
                //    doc._id = ;
                doc.serial = 0;
                console.log("inserting document: ", doc);
                var that = this;
                function afterwards(e, id) {
                    if (!e) {
                        console.log("inserted into '" + that.getName() + "' new id:" + id);
                        if (typeof p.setId == "function")
                            p.setId(id);
                        else
                            throw new Error("Unable to set Id after an object of class '" + mapper.className(that.theClass) + "' was inserted into collection '" + that.name + "'. Either only call insert with objects that already have an ID or declare a 'setId' function on the class.");
                        mapper.MeteorPersistence.updatePersistencePaths(p);
                    }
                    else
                        console.log("error while inserting into " + this.name, e);
                    if (callback)
                        callback(e, id);
                }
                try {
                    var id = this.meteorCollection.insert(doc, callback ? afterwards : undefined);
                    if (!callback)
                        afterwards(undefined, id);
                    else
                        return id;
                }
                catch (e) {
                    if (!callback)
                        afterwards(e);
                }
                return id;
            }
            else
                throw new Error("Insert can not be called on the client. Wrap it into a meteor method.");
        };
        BaseCollection.resetAll = function (cb) {
            var arr = [];
            for (var i in BaseCollection.meteorCollections)
                arr.push(BaseCollection.meteorCollections[i]);
            if (arr.length > 0) {
                for (var j in arr) {
                    if (j != arr.length - 1)
                        Meteor.wrapAsync(function (cb2) {
                            arr[j].remove({}, cb2);
                        })();
                    else {
                        arr[j].remove({}, cb);
                    }
                }
            }
            else
                cb();
        };
        BaseCollection.meteorCollections = {};
        return BaseCollection;
    })();
    mapper.BaseCollection = BaseCollection;
})(mapper || (mapper = {}));
mapper.MeteorPersistence.wrapFunction(mapper.BaseCollection, "resetAll", "resetAll", true, null, new mapper.ConstantObjectRetriever(mapper.BaseCollection));
///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var PersistencePath = (function () {
        function PersistencePath(className, id) {
            this.path = className;
            if (id)
                this.path += "[" + id + "]";
            if (!this.getId())
                throw new Error("id is undefined");
        }
        PersistencePath.prototype.clone = function () {
            return new PersistencePath(this.path);
        };
        PersistencePath.prototype.getCollectionName = function () {
            return this.path.split("[")[0];
        };
        PersistencePath.prototype.getId = function () {
            return this.path.split("[")[1].split("]")[0];
        };
        PersistencePath.prototype.getSubObject = function (rootObject) {
            var o = rootObject;
            if (this.path.indexOf(".") != -1) {
                this.path.split("].")[1].split(".").forEach(function (entry) {
                    if (o) {
                        if (entry.indexOf("|") != -1) {
                            var p = entry.split("|");
                            var arrayOrMap = o[p[0]];
                            var id = p[1];
                            var foundEntry = false;
                            for (var j in arrayOrMap) {
                                var arrayEntry = arrayOrMap[j];
                                if (arrayEntry.getId() == id) {
                                    o = arrayEntry;
                                    foundEntry = true;
                                    break;
                                }
                            }
                            if (!foundEntry)
                                o = undefined;
                        }
                        else
                            o = o[entry];
                    }
                });
            }
            return o;
        };
        PersistencePath.prototype.appendArrayOrMapLookup = function (name, id) {
            this.path += "." + name + "|" + id;
        };
        PersistencePath.prototype.appendPropertyLookup = function (name) {
            this.path += "." + name;
        };
        PersistencePath.prototype.toString = function () {
            return this.path;
        };
        return PersistencePath;
    })();
    mapper.PersistencePath = PersistencePath;
})(mapper || (mapper = {}));
///<reference path="./references.d.ts"/>
/**
 * Created by bert on 04.05.15.
 */
var DeSerializer;
(function (DeSerializer) {
    var Serializer = (function () {
        function Serializer(retri) {
            this.objectRetriever = retri;
        }
        Serializer.prototype.toObject = function (doc, f) {
            var o;
            if (typeof doc == "function")
                throw new Error("Error in 'toObject'. doc is a function.");
            if (f) {
                o = Object.create(f.prototype);
                f.call(o);
            }
            else if (typeof doc == "object") {
                o = {};
            }
            else
                return doc;
            for (var propertyName in doc) {
                var value = doc[propertyName];
                var propertyClass = mapper.PersistenceAnnotation.getPropertyClass(f, propertyName);
                var isStoredAsKeys = mapper.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                if (propertyClass && !isStoredAsKeys) {
                    if (mapper.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry = value[i];
                            entry = this.toObject(entry, propertyClass);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[propertyName] = result;
                    }
                    else {
                        o[propertyName] = this.toObject(value, propertyClass);
                    }
                }
                else {
                    o[propertyName] = value;
                }
            }
            return o;
        };
        Serializer.prototype.toDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            if (typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
                return object;
            else {
                var result;
                var parentClass = mapper.PersistenceAnnotation.getClass(parentObject);
                if (parentObject && propertyNameOnParentObject && mapper.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                    return this.objectRetriever.getId(object);
                }
                else if (typeof object.toDocument == "function")
                    result = object.toDocument();
                else {
                    result = this.createDocument(object, rootClass ? rootClass : mapper.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                }
            }
            return result;
        };
        Serializer.prototype.createDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var doc = {};
            var objectClass = mapper.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (property == "id") {
                    doc._id = object.id;
                }
                else if (object[property] !== undefined && property != "persistencePath") {
                    // primitives
                    if (typeof value == "string" || typeof value == "number" || typeof value == "date" || typeof value == "boolean")
                        doc[property] = value;
                    else if (mapper.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                        var result;
                        if (Array.isArray(object[property]))
                            result = [];
                        else
                            result = {};
                        for (var i in value) {
                            var subObject = value[i];
                            result[i] = this.toDocument(subObject, rootClass, object, property);
                        }
                        doc[property] = result;
                    }
                    else if (typeof object[property] == 'object') {
                        doc[property] = this.toDocument(value, rootClass, object, property);
                    }
                    else if (typeof value == 'function') {
                    }
                    else {
                        console.error("Unsupported type : ", typeof value);
                    }
                }
            }
            return doc;
        };
        Serializer.prototype.getClassName = function (o) {
            if (typeof o == "object" && mapper.PersistenceAnnotation.getClass(o)) {
                return mapper.className(mapper.PersistenceAnnotation.getClass(o));
            }
            else
                return typeof o;
        };
        return Serializer;
    })();
    DeSerializer.Serializer = Serializer;
})(DeSerializer || (DeSerializer = {}));
/**
 * Created by bert on 04.05.15.
 */
///<reference path="./references.d.ts"/>
var mapper;
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
        // TODO new name
        MeteorPersistence.objectsClassName = function (o) {
            return mapper.className(o.constructor);
        };
        //private static loadPath(s:string):Persistable {
        //    if (typeof s != "string")
        //        throw new Error("Path needs to be a string");
        //    var persistencePath = new mapper.PersistencePath(s);
        //    var typeClass:TypeClass<any> = mapper.PersistenceAnnotation.getEntityClassByName( persistencePath.getClassName() );
        //    if( !typeClass || typeof typeClass != "function" )
        //        throw new Error( "Could not load path. No class found for class name :"+ persistencePath.getClassName()+". Total path:"+s );
        //    var collectionName = mapper.PersistenceAnnotation.getCollectionName( typeClass );
        //    var collection:mapper.BaseCollection<Persistable> = collectionName ? MeteorPersistence.collections[collectionName] : undefined;
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
            // iterate over all properties of the prototype. this is where the functions are.
            //var that = this;
            mapper.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var domainObjectFunction = c.prototype[functionName];
                // this is executed last. it wraps the original function into a collection.update
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
                // this is executed second. a meteor call is made for the objects that need updating
                MeteorPersistence.wrapFunction(c.prototype, functionName, className + "." + functionName, false, MeteorPersistence.serializer, MeteorPersistence.meteorObjectRetriever);
                //this is executed first. it check if the object is part of the persistence layer and only if it is it calls the functions below
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
            mapper.PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
                if (mapper.PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
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
        // todo  make the persistencePath enumerable:false everywhere it is set
        // static setPersistencePath(){
        //
        //}
        MeteorPersistence.updatePersistencePaths = function (object, visited) {
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            if (!object || typeof object != "object")
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
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v = object[typedPropertyName];
                    if (v) {
                        if (mapper.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
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
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + mapper.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
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
                            if (mapper.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
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
                    // If this is object is part of persistence and no wrapped call is in progress ...
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
                    // BUG if the method contains a callback it is called twice due to the code below
                    //sdfasdf
                    //// the object needs to be updated with the result form the update function
                    //if (!serverOnly) {
                    //    // also call the method on the current object so that it reflects the update
                    //    var result = patchedFunction.apply(this, originalArguments);
                    //    return result;
                    //}
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
Meteor.startup(function () {
    mapper.MeteorPersistence.init();
});
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
//        var persistencePath = new mapper.PersistencePath(persistencePathString);
//        for( var ai = 0; ai<args.length; ai++ )
//        {
//            if( mapper.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) )
//            {
//                console.log("deserializing "+typeNames[ai] );
//                args[ai] = DeSerializer.Serializer.toObject(args[ai], mapper.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) );
//            }
//        }
//        var collection:mapper.BaseCollection<any> = mapper.MeteorPersistence.collections[persistencePath.getClassName()];
//        try
//        {
//            mapper.MeteorPersistence.wrappedCallInProgress = true;
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
//            mapper.MeteorPersistence.wrappedCallInProgress = false;
//        }
//    }
//});
///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    function Entity(p1) {
        if (typeof p1 == "string") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(<class>) " + className(typeClass) + " with collection name:" + p1);
                Reflect.defineMetadata("persistence:collectionName", p1, typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
            };
        }
        if (typeof p1 == "boolean") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(true) " + className(typeClass) + " with collection name:", className(typeClass));
                if (p1)
                    Reflect.defineMetadata("persistence:collectionName", className(typeClass), typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
            };
        }
        else if (typeof p1 == "function") {
            //var tc:TypeClass<Persistable> = <TypeClass<Persistable>>p1;
            //var className = PersistenceAnnotation.className(tc);
            //PersistencePrivate.collectionRootClasses.push(tc);
            var typeClass = p1;
            console.log("Entity() " + className(typeClass));
            //Reflect.defineMetadata("persistence:collectionName", PersistenceAnnotation.className(typeClass), typeClass);
            Reflect.defineMetadata("persistence:entity", true, typeClass);
            PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
        }
    }
    mapper.Entity = Entity;
    function Wrap(t, functionName, objectDescriptor) {
        Reflect.defineMetadata("persistence:wrap", true, t[functionName]);
    }
    mapper.Wrap = Wrap;
    function ArrayOrMap(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as collection of " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "arrayOrMap", true);
        };
    }
    mapper.ArrayOrMap = ArrayOrMap;
    function AsForeignKeys(targetPrototypeObject, propertyName) {
        return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "askeys", true);
    }
    mapper.AsForeignKeys = AsForeignKeys;
    // for grammar reasons
    function AsForeignKey(targetPrototypeObject, propertyName) {
        return AsForeignKeys(targetPrototypeObject, propertyName);
    }
    mapper.AsForeignKey = AsForeignKey;
    function Type(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
        };
    }
    mapper.Type = Type;
    function className(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }
    mapper.className = className;
    var PersistenceAnnotation = (function () {
        function PersistenceAnnotation() {
        }
        PersistenceAnnotation.getClass = function (o) {
            if (o)
                return o.constructor;
            else
                return undefined;
        };
        // ---- Entity ----
        PersistenceAnnotation.getEntityClassByName = function (className) {
            return PersistencePrivate.entityClasses[className];
        };
        PersistenceAnnotation.getCollectionClasses = function () {
            var result = [];
            for (var i in PersistencePrivate.entityClasses) {
                var entityClass = PersistencePrivate.entityClasses[i];
                if (PersistenceAnnotation.getCollectionName(entityClass))
                    result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getEntityClasses = function () {
            var result = [];
            for (var i in PersistencePrivate.entityClasses) {
                var entityClass = PersistencePrivate.entityClasses[i];
                result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getCollectionName = function (f) {
            return Reflect.getMetadata("persistence:collectionName", f);
        };
        PersistenceAnnotation.isRootEntity = function (f) {
            return !!PersistenceAnnotation.getCollectionName(f);
        };
        PersistenceAnnotation.isEntity = function (f) {
            return !!PersistencePrivate.entityClasses[className(f)];
        };
        // ---- Collection ----
        PersistenceAnnotation.isArrayOrMap = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "arrayOrMap") == true;
        };
        // ---- typed properties ----
        PersistenceAnnotation.getPropertyClass = function (f, propertyName) {
            var className = PersistenceAnnotation.getPropertyProperty(f.prototype, propertyName, "type");
            if (!className)
                return undefined;
            else
                return PersistenceAnnotation.getEntityClassByName(className);
        };
        PersistenceAnnotation.getTypedPropertyNames = function (f) {
            var result = [];
            var props = Reflect.getMetadata("persistence:typedproperties", f.prototype);
            for (var i in props) {
                if (PersistenceAnnotation.getPropertyClass(f, i))
                    result.push(i);
            }
            return result;
        };
        PersistenceAnnotation.setPropertyProperty = function (targetPrototypeObject, propertyName, property, value) {
            var arr = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if (!arr) {
                arr = {};
                Reflect.defineMetadata("persistence:typedproperties", arr, targetPrototypeObject);
            }
            var propProps = arr[propertyName];
            if (!propProps) {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        };
        PersistenceAnnotation.getPropertyProperty = function (targetPrototypeObject, propertyName, propertyProperty) {
            var arr = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if (arr && arr[propertyName]) {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        };
        // ---- AsForeignKeys ----
        PersistenceAnnotation.isStoredAsForeignKeys = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "askeys");
        };
        // ---- Wrap ----
        PersistenceAnnotation.getWrappedFunctionNames = function (f) {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        };
        PersistenceAnnotation.getPropertyNamesByMetaData = function (o, metaData) {
            var result = [];
            for (var i in o) {
                var value = o[i];
                //console.log("Cave man style debugging 1",i, value,Reflect.getMetadata("persistence:wrap", value) );
                if (typeof value == "function" && Reflect.getMetadata(metaData, value))
                    result.push(i);
            }
            return result;
        };
        return PersistenceAnnotation;
    })();
    mapper.PersistenceAnnotation = PersistenceAnnotation;
    var PersistencePrivate = (function () {
        function PersistencePrivate() {
        }
        PersistencePrivate.entityClasses = {};
        return PersistencePrivate;
    })();
})(mapper || (mapper = {}));
///<reference path="./references.d.ts"/>
///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var MeteorObjectRetriever = (function () {
        function MeteorObjectRetriever() {
        }
        MeteorObjectRetriever.prototype.getId = function (object) {
            if (object.persistencePath)
                return object.persistencePath.toString();
            else {
                var objectClass = mapper.PersistenceAnnotation.getClass(object);
                if (mapper.PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                    return new mapper.PersistencePath(mapper.PersistenceAnnotation.getCollectionName(objectClass), object.getId()).toString();
                }
                else {
                    throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
                }
            }
        };
        MeteorObjectRetriever.prototype.getObject = function (s) {
            if (typeof s != "string")
                throw new Error("Path needs to be a string");
            var persistencePath = new mapper.PersistencePath(s);
            //var typeClass:TypeClass<any> = mapper.PersistenceAnnotation.getCollectionName(persistencePath.getClassName());
            //if (!typeClass || typeof typeClass != "function")
            //    throw new Error("Could not load path. No class found for class name :" + persistencePath.getClassName() + ". Key:" + s);
            var collectionName = persistencePath.getCollectionName();
            var collection = collectionName ? mapper.MeteorPersistence.collections[collectionName] : undefined;
            if (collection) {
                var rootValue = collection.getById(persistencePath.getId());
                var newValue = rootValue ? persistencePath.getSubObject(rootValue) : undefined;
                return newValue;
            }
            else
                throw new Error("No collection found to retrieve object. Key:" + s);
        };
        return MeteorObjectRetriever;
    })();
    mapper.MeteorObjectRetriever = MeteorObjectRetriever;
})(mapper || (mapper = {}));
///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var ConstantObjectRetriever = (function () {
        function ConstantObjectRetriever(o) {
            this.value = o;
        }
        ConstantObjectRetriever.prototype.getId = function (o) {
            return "constant";
        };
        ConstantObjectRetriever.prototype.getObject = function (s) {
            return this.value;
        };
        return ConstantObjectRetriever;
    })();
    mapper.ConstantObjectRetriever = ConstantObjectRetriever;
})(mapper || (mapper = {}));
/**
 * Created by bert on 04.05.15.
 */
///<reference path="./references.d.ts"/>
///<reference path="../meteor/packages/mapper/references.d.ts"/>
module.exports = mapper;
