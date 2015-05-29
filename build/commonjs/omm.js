/// <reference path="./TypeClass.ts"/>
var omm;
(function (omm) {
    function Entity(p1) {
        if (typeof p1 == "string") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(<class>) " + className(typeClass) + " with collection name:" + p1);
                Reflect.defineMetadata("persistence:collectionName", p1, typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                _registred.entityClasses[className(typeClass)] = typeClass;
            };
        }
        if (typeof p1 == "boolean") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(true) " + className(typeClass) + " with collection name:", className(typeClass));
                if (p1)
                    Reflect.defineMetadata("persistence:collectionName", className(typeClass), typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                _registred.entityClasses[className(typeClass)] = typeClass;
            };
        }
        else if (typeof p1 == "function") {
            var typeClass = p1;
            console.log("Entity() " + className(typeClass));
            Reflect.defineMetadata("persistence:entity", true, typeClass);
            _registred.entityClasses[className(typeClass)] = typeClass;
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
            return _registred.entityClasses[className];
        };
        PersistenceAnnotation.getCollectionClasses = function () {
            var result = [];
            for (var i in _registred.entityClasses) {
                var entityClass = _registred.entityClasses[i];
                if (PersistenceAnnotation.getCollectionName(entityClass))
                    result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getEntityClasses = function () {
            var result = [];
            for (var i in _registred.entityClasses) {
                var entityClass = _registred.entityClasses[i];
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
            return !!_registred.entityClasses[className(f)];
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
    var _registred = (function () {
        function _registred() {
        }
        _registred.entityClasses = {};
        return _registred;
    })();
    omm._registred = _registred;
})(omm || (omm = {}));
var omm;
(function (omm) {
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
        PersistencePath.prototype.forEachPathEntry = function (iterator) {
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
    omm.PersistencePath = PersistencePath;
})(omm || (omm = {}));
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
///<reference path="../annotations/Document.ts"/>
///<reference path="../annotations/PersistencePath.ts"/>
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/PersistencePath.ts"/>
///<reference path="../annotations/Document.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
var omm;
(function (omm) {
    var Serializer = (function () {
        function Serializer(retri) {
            this.objectRetriever = retri;
        }
        Serializer.prototype.toObject = function (doc, f) {
            var o;
            if (typeof doc == "function")
                throw new Error("Error in 'toObject'. doc is a function.");
            if (f) {
                if (typeof f.toObject == "function") {
                    return f.toObject(doc);
                }
                else {
                    if (doc.className)
                        f = omm.PersistenceAnnotation.getEntityClassByName(doc.className);
                    o = Object.create(f.prototype);
                }
            }
            else if (typeof doc == "object") {
                o = {};
            }
            else {
                return doc;
            }
            for (var propertyName in doc) {
                var value = doc[propertyName];
                var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, propertyName);
                var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                if (propertyClass && !isStoredAsKeys) {
                    if (omm.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry = value[i];
                            entry = this.toObject(entry, propertyClass);
                            result[i] = entry;
                        }
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
                if (value !== undefined && property != "persistencePath") {
                    if (omm.PersistenceAnnotation.getPropertyClass(objectClass, property)) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                            var result;
                            if (Array.isArray(value))
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
        Serializer.prototype.getClassName = function (o) {
            if (typeof o == "object" && omm.PersistenceAnnotation.getClass(o)) {
                return omm.className(omm.PersistenceAnnotation.getClass(o));
            }
            else
                return typeof o;
        };
        return Serializer;
    })();
    omm.Serializer = Serializer;
})(omm || (omm = {}));

module.exports = omm;
