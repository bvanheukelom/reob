/// <reference path="./TypeClass.ts"/>
/// <reference path="../../../../typings/node/node.d.ts"/>
var omm;
(function (omm) {
    omm.entityClasses;
    function Entity(p1) {
        if (typeof p1 == "string") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(<class>) " + className(typeClass) + " with collection name:" + p1);
                Reflect.defineMetadata("persistence:collectionName", p1, typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                omm.entityClasses[className(typeClass)] = typeClass;
            };
        }
        if (typeof p1 == "boolean") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(true) " + className(typeClass) + " with collection name:", className(typeClass));
                if (p1)
                    Reflect.defineMetadata("persistence:collectionName", className(typeClass), typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                omm.entityClasses[className(typeClass)] = typeClass;
            };
        }
        else if (typeof p1 == "function") {
            var typeClass = p1;
            console.log("Entity() " + className(typeClass));
            Reflect.defineMetadata("persistence:entity", true, typeClass);
            omm.entityClasses[className(typeClass)] = typeClass;
        }
    }
    omm.Entity = Entity;
    function Wrap(t, functionName, objectDescriptor) {
        Reflect.defineMetadata("persistence:wrap", true, t[functionName]);
    }
    omm.Wrap = Wrap;
    function ArrayOrMap(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as collection of " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "arrayOrMap", true);
        };
    }
    omm.ArrayOrMap = ArrayOrMap;
    function AsForeignKeys(targetPrototypeObject, propertyName) {
        return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "askeys", true);
    }
    omm.AsForeignKeys = AsForeignKeys;
    function AsForeignKey(targetPrototypeObject, propertyName) {
        return AsForeignKeys(targetPrototypeObject, propertyName);
    }
    omm.AsForeignKey = AsForeignKey;
    function Type(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
        };
    }
    omm.Type = Type;
    function className(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }
    omm.className = className;
    var PersistenceAnnotation = (function () {
        function PersistenceAnnotation() {
        }
        PersistenceAnnotation.getClass = function (o) {
            if (o)
                return o.constructor;
            else
                return undefined;
        };
        PersistenceAnnotation.getEntityClassByName = function (className) {
            return omm.entityClasses[className];
        };
        PersistenceAnnotation.getCollectionClasses = function () {
            var result = [];
            for (var i in omm.entityClasses) {
                var entityClass = omm.entityClasses[i];
                if (PersistenceAnnotation.getCollectionName(entityClass))
                    result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getEntityClasses = function () {
            var result = [];
            for (var i in omm.entityClasses) {
                var entityClass = omm.entityClasses[i];
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
            return !!omm.entityClasses[className(f)];
        };
        PersistenceAnnotation.isArrayOrMap = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "arrayOrMap") == true;
        };
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
        PersistenceAnnotation.isStoredAsForeignKeys = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "askeys");
        };
        PersistenceAnnotation.getWrappedFunctionNames = function (f) {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        };
        PersistenceAnnotation.getPropertyNamesByMetaData = function (o, metaData) {
            var result = [];
            for (var i in o) {
                var value = o[i];
                if (typeof value == "function" && Reflect.getMetadata(metaData, value))
                    result.push(i);
            }
            return result;
        };
        return PersistenceAnnotation;
    })();
    omm.PersistenceAnnotation = PersistenceAnnotation;
})(omm || (omm = {}));
if (typeof global != "undefined") {
    if (!global["entityClasses"])
        global["entityClasses"] = {};
    omm.entityClasses = global["entityClasses"];
}
else if (typeof window != "undefined") {
    if (!window["entityClasses"])
        window["entityClasses"] = {};
    omm.entityClasses = window["entityClasses"];
}
else
    omm.entityClasses = {};
var omm;
(function (omm) {
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
        ConstantObjectRetriever.prototype.retrieveLocalKeys = function (o) {
        };
        return ConstantObjectRetriever;
    })();
    omm.ConstantObjectRetriever = ConstantObjectRetriever;
})(omm || (omm = {}));
var omm;
(function (omm) {
    var SerializationPath = (function () {
        function SerializationPath(objectRetriever, className, id) {
            this.path = className;
            this.objectRetriever = objectRetriever;
            if (id)
                this.path += "[" + id + "]";
            if (!this.getId())
                throw new Error("id is undefined");
        }
        SerializationPath.prototype.clone = function () {
            return new SerializationPath(this.objectRetriever, this.path);
        };
        SerializationPath.prototype.getCollectionName = function () {
            return this.path.split("[")[0];
        };
        SerializationPath.prototype.getObjectRetriever = function () {
            return this.objectRetriever;
        };
        SerializationPath.prototype.getId = function () {
            return this.path.split("[")[1].split("]")[0];
        };
        SerializationPath.prototype.forEachPathEntry = function (iterator) {
            if (this.path.indexOf(".") != -1)
                this.path.split("].")[1].split(".").forEach(function (entry) {
                    var propertyName = entry;
                    var index = undefined;
                    if (entry.indexOf("|") != -1) {
                        propertyName = entry.split("|")[0];
                        index = entry.split("|")[1];
                    }
                    iterator(propertyName, index);
                });
        };
        SerializationPath.prototype.getSubObject = function (rootObject) {
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
        SerializationPath.prototype.appendArrayOrMapLookup = function (name, id) {
            this.path += "." + name + "|" + id;
        };
        SerializationPath.prototype.appendPropertyLookup = function (name) {
            this.path += "." + name;
        };
        SerializationPath.prototype.toString = function () {
            return this.path;
        };
        return SerializationPath;
    })();
    omm.SerializationPath = SerializationPath;
})(omm || (omm = {}));
///<reference path="./Document.ts"/>
///<reference path="./SerializationPath.ts"/>
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./SerializationPath.ts"/>
///<reference path="./Document.ts"/>
var omm;
(function (omm) {
    var Serializer = (function () {
        function Serializer(retri) {
            this.objectRetriever = retri;
        }
        Serializer.init = function () {
            omm.PersistenceAnnotation.getEntityClasses().forEach(function (c) {
                Serializer.installLazyLoaderGetterSetters(c);
            });
        };
        Serializer.installLazyLoaderGetterSetters = function (c) {
            omm.PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName) {
                if (omm.PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
                    var propertyDescriptor = Object.getOwnPropertyDescriptor(c.prototype, propertyName);
                    Object.defineProperty(c.prototype, propertyName, {
                        get: function () {
                            var v;
                            if (propertyDescriptor && propertyDescriptor.get)
                                v = propertyDescriptor.get.apply(this);
                            else
                                v = this["_" + propertyName];
                            if (Serializer.needsLazyLoading(this, propertyName)) {
                                var objectRetriever = this._serializationPath.getObjectRetriever();
                                if (typeof v == "string") {
                                    console.log("Lazy loading " + omm.className + "." + propertyName);
                                    v = objectRetriever.getObject(v);
                                    this[propertyName] = v;
                                }
                                else {
                                    console.log("Lazy loading array/map " + omm.className + "." + propertyName);
                                    for (var i in v) {
                                        var ele = v[i];
                                        v[i] = objectRetriever.getObject(ele);
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
                    console.log("On Class " + omm.className + ": no lazy loader for " + propertyName);
            });
        };
        Serializer.prototype.setSerializationPath = function (o, pPath) {
            if (!Object.getOwnPropertyDescriptor(o, "_serializationPath")) {
                Object.defineProperty(this, "_serializationPath", {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            o._serializationPath = pPath;
        };
        Serializer.needsLazyLoading = function (object, propertyName) {
            var oc = omm.PersistenceAnnotation.getClass(object);
            if (omm.PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName)) {
                var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
                var shadowPropertyIsKeys = false;
                if (shadowpropertyDescriptor)
                    if (typeof object["_" + propertyName] == "string")
                        shadowPropertyIsKeys = true;
                    else if (omm.PersistenceAnnotation.isArrayOrMap(oc, propertyName)) {
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
        Serializer.prototype._updateSerializationPaths = function (object, visited) {
            var that = this;
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            if (!object || typeof object != "object")
                return;
            visited.push(object);
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            if (omm.PersistenceAnnotation.isRootEntity(objectClass)) {
                if (!object._serializationPath) {
                    if (object.getId())
                        this.setSerializationPath(object, new omm.SerializationPath(this.objectRetriever, omm.PersistenceAnnotation.getCollectionName(objectClass), object.getId()));
                }
            }
            if (!object._serializationPath)
                return;
            omm.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
                if (!omm.PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    var v = object[typedPropertyName];
                    if (v) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            for (var i in v) {
                                var e = v[i];
                                if (e.getId && e.getId()) {
                                    that.setSerializationPath(e, object._serializationPath.clone());
                                    e._serializationPath.appendArrayOrMapLookup(typedPropertyName, e.getId());
                                    that._updateSerializationPaths(e, visited);
                                }
                                else
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + omm.className(objectClass) + " does not have an id. Total serialization path so far:" + object._serializationPath.toString());
                            }
                        }
                        else {
                            that.setSerializationPath(v, object._serializationPath.clone());
                            v._serializationPath.appendPropertyLookup(typedPropertyName);
                            that._updateSerializationPaths(v, visited);
                        }
                    }
                }
                else {
                    if (!Serializer.needsLazyLoading(object, typedPropertyName)) {
                        var v = object[typedPropertyName];
                        if (v) {
                            if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e._serializationPath) {
                                        that._updateSerializationPaths(e, visited);
                                    }
                                }
                            }
                            else if (!v._serializationPath)
                                that._updateSerializationPaths(v, visited);
                        }
                    }
                }
            });
        };
        Serializer.prototype.toObject = function (doc, f) {
            var o = this.toObjectRecursive(doc, f);
            this._updateSerializationPaths(o);
            this.retrieveLocalKeys(o);
            return o;
        };
        Serializer.prototype.toObjectRecursive = function (doc, f) {
            var o;
            if (typeof doc == "function")
                throw new Error("Error in 'toObject'. doc is a function.");
            if (typeof f["toObject"] == "function") {
                o = f["toObject"](doc);
            }
            else {
                if (doc.className)
                    f = omm.PersistenceAnnotation.getEntityClassByName(doc.className);
                o = Object.create(f.prototype);
                for (var propertyName in doc) {
                    var value = doc[propertyName];
                    var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, propertyName);
                    var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                    if (propertyClass && !isStoredAsKeys) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                            var result = Array.isArray(value) ? [] : {};
                            for (var i in value) {
                                var entry = value[i];
                                entry = this.toObjectRecursive(entry, propertyClass);
                                result[i] = entry;
                            }
                            o[propertyName] = result;
                        }
                        else {
                            o[propertyName] = this.toObjectRecursive(value, propertyClass);
                        }
                    }
                    else {
                        o[propertyName] = value;
                    }
                }
            }
            return o;
        };
        Serializer.prototype.toDocument = function (object) {
            return this.toDocumentRecursive(object);
        };
        Serializer.prototype.toDocumentRecursive = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var result;
            if (typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
                result = object;
            else {
                var objectClass = omm.PersistenceAnnotation.getClass(object);
                if (typeof objectClass.toDocument == "function") {
                    result = objectClass.toDocument(object);
                }
                else {
                    var parentClass = omm.PersistenceAnnotation.getClass(parentObject);
                    if (parentObject && propertyNameOnParentObject && omm.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                        return this.objectRetriever.getId(object);
                    }
                    else {
                        result = this.createDocument(object, rootClass ? rootClass : omm.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                        if (parentClass && objectClass != omm.PersistenceAnnotation.getPropertyClass(parentClass, propertyNameOnParentObject))
                            result.className = omm.className(objectClass);
                    }
                }
            }
            return result;
        };
        Serializer.prototype.createDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var doc = {};
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (value !== undefined && property != "_serializationPath") {
                    if (omm.PersistenceAnnotation.getPropertyClass(objectClass, property)) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                            var result;
                            if (Array.isArray(value))
                                result = [];
                            else
                                result = {};
                            for (var i in value) {
                                var subObject = value[i];
                                result[i] = this.toDocumentRecursive(subObject, rootClass, object, property);
                            }
                            doc[property] = result;
                        }
                        else if (typeof object[property] == 'object') {
                            doc[property] = this.toDocumentRecursive(value, rootClass, object, property);
                        }
                        else {
                            throw new Error("Unsupported type : " + typeof value);
                        }
                    }
                    else if (typeof value == 'function') {
                    }
                    else {
                        doc[property] = value;
                    }
                }
            }
            return doc;
        };
        Serializer.prototype.retrieveLocalKeys = function (o, visited, rootObject) {
            if (!o)
                return;
            if (!visited)
                visited = [];
            if (visited.indexOf(o) != -1)
                return;
            visited.push(o);
            var that = this;
            if (!rootObject)
                rootObject = o;
            var theClass = omm.PersistenceAnnotation.getClass(o);
            var spp = rootObject._serializationPath;
            if (spp) {
                var that = this;
                omm.PersistenceAnnotation.getTypedPropertyNames(theClass).forEach(function (properyName) {
                    var isKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(theClass, properyName);
                    var needsLazyLoading = omm.Serializer.needsLazyLoading(o, properyName);
                    var isArray = omm.PersistenceAnnotation.isArrayOrMap(theClass, properyName);
                    if (isKeys && needsLazyLoading && !isArray) {
                        var key = o["_" + properyName];
                        var pp = new omm.SerializationPath(this.objectRetriever, key);
                        if (pp.getCollectionName() == spp.getCollectionName() && pp.getId() == spp.getId()) {
                            o[properyName] = pp.getSubObject(rootObject);
                        }
                    }
                    if (!omm.Serializer.needsLazyLoading(o, properyName)) {
                        if (isArray) {
                            for (var i in o[properyName]) {
                                that.retrieveLocalKeys(o[properyName][i], visited, rootObject);
                            }
                        }
                        else
                            that.retrieveLocalKeys(o[properyName], visited, rootObject);
                    }
                });
            }
        };
        return Serializer;
    })();
    omm.Serializer = Serializer;
})(omm || (omm = {}));

module.exports = omm;
