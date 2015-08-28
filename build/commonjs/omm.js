/// <reference path="./TypeClass.ts"/>
/// <reference path="../../../../typings/node/node.d.ts"/>
var omm;
(function (omm) {
    omm.entityClasses;
    omm.registeredObjects;
    omm.meteorMethodFunctions;
    function setNonEnumerableProperty(obj, propertyName, value) {
        if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
            Object.defineProperty(obj, propertyName, {
                configurable: false,
                enumerable: false,
                writable: true
            });
        }
        obj[propertyName] = value;
    }
    omm.setNonEnumerableProperty = setNonEnumerableProperty;
    function defineMetadata(propertyName, value, cls) {
        if (!cls.hasOwnProperty("_ommAnnotations")) {
            omm.setNonEnumerableProperty(cls, "_ommAnnotations", {});
        }
        var _ommAnnotations = cls._ommAnnotations;
        _ommAnnotations[propertyName] = value;
    }
    omm.defineMetadata = defineMetadata;
    function getMetadata(propertyName, cls) {
        if (cls.hasOwnProperty("_ommAnnotations"))
            return cls["_ommAnnotations"][propertyName];
        else {
            return undefined;
        }
    }
    omm.getMetadata = getMetadata;
    function Entity(p1) {
        var typeClass = p1;
        defineMetadata("persistence:entity", true, typeClass);
        omm.entityClasses[className(typeClass)] = typeClass;
    }
    omm.Entity = Entity;
    function addEntity(c) {
        omm.Entity(c);
    }
    omm.addEntity = addEntity;
    function getDefaultCollectionName(t) {
        return omm.className(t);
    }
    omm.getDefaultCollectionName = getDefaultCollectionName;
    function addCollectionRoot(t, collectionName) {
        defineMetadata("persistence:collectionName", collectionName, t);
    }
    omm.addCollectionRoot = addCollectionRoot;
    function Wrap(t, functionName, objectDescriptor) {
        omm.CollectionUpdate(t, functionName);
        omm.MeteorMethod({ replaceWithCall: true })(t, functionName, objectDescriptor);
    }
    omm.Wrap = Wrap;
    function CollectionUpdate(p1, fName) {
        var options = {};
        if (fName) {
            PersistenceAnnotation.setPropertyProperty(p1, fName, "collectionUpdate", options);
        }
        else {
            return function (t, functionName, objectDescriptor) {
                options = p1;
                PersistenceAnnotation.setPropertyProperty(t, functionName, "collectionUpdate", options);
            };
        }
    }
    omm.CollectionUpdate = CollectionUpdate;
    function collectionUpdate(c, functionName, options) {
        if (!options) {
            omm.CollectionUpdate(c, functionName);
        }
        else {
            omm.CollectionUpdate(options)(c, functionName);
        }
    }
    omm.collectionUpdate = collectionUpdate;
    function ArrayOrMap(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "arrayOrMap", true);
        };
    }
    omm.ArrayOrMap = ArrayOrMap;
    function ArrayType(typeClassName) {
        return omm.ArrayOrMap(typeClassName);
    }
    omm.ArrayType = ArrayType;
    function arrayType(c, propertyName, typeClassName) {
        omm.ArrayOrMap(typeClassName)(c.prototype, propertyName);
    }
    omm.arrayType = arrayType;
    function DictionaryType(typeClassName) {
        return omm.ArrayOrMap(typeClassName);
    }
    omm.DictionaryType = DictionaryType;
    function dictionaryType(typeClassName) {
        return omm.ArrayOrMap(typeClassName);
    }
    omm.dictionaryType = dictionaryType;
    function AsForeignKeys(targetPrototypeObject, propertyName) {
        return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "askeys", true);
    }
    omm.AsForeignKeys = AsForeignKeys;
    function Id(targetPrototypeObject, propertyName) {
        omm.DocumentName("_id")(targetPrototypeObject, propertyName);
    }
    omm.Id = Id;
    function Parent(targetPrototypeObject, propertyName) {
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "parent", 1);
    }
    omm.Parent = Parent;
    function idProperty(c, propertyName) {
        omm.Id(c.prototype, propertyName);
    }
    omm.idProperty = idProperty;
    function Ignore(targetPrototypeObject, propertyName) {
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "ignore", true);
    }
    omm.Ignore = Ignore;
    function ignoreProperty(c, propertyName) {
        omm.Ignore(c.prototype, propertyName);
    }
    omm.ignoreProperty = ignoreProperty;
    function DocumentName(name) {
        return function (targetPrototypeObject, propertyName) {
            var objNames = getMetadata("objectNames", targetPrototypeObject);
            if (!objNames) {
                objNames = {};
                defineMetadata("objectNames", objNames, targetPrototypeObject);
            }
            var documentNames = getMetadata("documentNames", targetPrototypeObject);
            if (!documentNames) {
                documentNames = {};
                defineMetadata("documentNames", documentNames, targetPrototypeObject);
            }
            objNames[name] = propertyName;
            documentNames[propertyName] = name;
        };
    }
    omm.DocumentName = DocumentName;
    function AsForeignKey(targetPrototypeObject, propertyName) {
        return AsForeignKeys(targetPrototypeObject, propertyName);
    }
    omm.AsForeignKey = AsForeignKey;
    function Type(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "type", typeClassName);
        };
    }
    omm.Type = Type;
    function type(t, propertyName, className) {
        omm.Type(className)(t.prototype, propertyName);
    }
    omm.type = type;
    function propertyType(t, propertyName, typeClassName) {
        omm.Type(typeClassName)(t.prototype, propertyName);
    }
    omm.propertyType = propertyType;
    function propertyArrayType(t, propertyName, typeClassName) {
        omm.ArrayType(typeClassName)(t.prototype, propertyName);
    }
    omm.propertyArrayType = propertyArrayType;
    function propertyDictionaryType(t, propertyName, typeClassName) {
        omm.DictionaryType(typeClassName)(t.prototype, propertyName);
    }
    omm.propertyDictionaryType = propertyDictionaryType;
    function asForeignKey(c, propertyName) {
        omm.AsForeignKey(c.prototype, propertyName);
    }
    omm.asForeignKey = asForeignKey;
    function getId(o) {
        var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(omm.PersistenceAnnotation.getClass(o));
        if (!idPropertyName)
            throw new Error("No id property defined for object of class " + omm.PersistenceAnnotation.getClass(o));
        else
            return o[idPropertyName];
    }
    omm.getId = getId;
    function className(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }
    omm.className = className;
    function MeteorMethod(p1, p2) {
        if (typeof p1 == "object" && typeof p2 == "string") {
            var options = { isStatic: false };
            options.parentObject = p1;
            options.functionName = p2;
            if (!options.name)
                options.name = omm.className(p1.constructor) + "-" + p2;
            omm.meteorMethodFunctions[options.name] = options;
        }
        else {
            return function (t, functionName, objectDescriptor) {
                var options = {};
                if (typeof p1 == "object")
                    options = p1;
                else if (typeof p1 == "string") {
                    if (typeof p2 == "object")
                        options = p2;
                    options.name = p1;
                }
                options.functionName = functionName;
                options.isStatic = false;
                options.parentObject = t;
                if (!options.name) {
                    options.name = omm.className(t.constructor) + "-" + functionName;
                }
                omm.meteorMethodFunctions[options.name] = options;
            };
        }
    }
    omm.MeteorMethod = MeteorMethod;
    function StaticMeteorMethod(p1, p2) {
        if (typeof p1 == "function" && typeof p2 == "string") {
            var options = { isStatic: true };
            options.parentObject = p1;
            options.functionName = p2;
            options.object = p1;
            if (!options.name)
                options.name = omm.className(p1) + "-" + p2;
            omm.meteorMethodFunctions[options.name] = options;
        }
        else {
            return function (t, functionName, objectDescriptor) {
                var options = {};
                if (typeof p1 == "object")
                    options = p1;
                else if (typeof p1 == "string") {
                    if (typeof p2 == "object")
                        options = p2;
                    options.name = p1;
                }
                options.parentObject = t;
                options.functionName = functionName;
                options.isStatic = true;
                options.object = t;
                if (!options.name)
                    options.name = omm.className(t) + "-" + functionName;
                omm.meteorMethodFunctions[options.name] = options;
            };
        }
    }
    omm.StaticMeteorMethod = StaticMeteorMethod;
    var PersistenceAnnotation = (function () {
        function PersistenceAnnotation() {
        }
        PersistenceAnnotation.getMethodOptions = function (functionName) {
            return omm.meteorMethodFunctions[functionName];
        };
        PersistenceAnnotation.getMethodFunctionNames = function (c) {
            var ret = [];
            for (var i in omm.meteorMethodFunctions) {
                var methodOptions = omm.meteorMethodFunctions[i];
                if (methodOptions.parentObject == c)
                    ret.push(i);
            }
            return ret;
        };
        PersistenceAnnotation.getMethodFunctionNamesByObject = function (o) {
            var ret = [];
            for (var i in omm.meteorMethodFunctions) {
                var methodOptions = omm.meteorMethodFunctions[i];
                if (methodOptions.object == o)
                    ret.push(i);
            }
            return ret;
        };
        PersistenceAnnotation.getAllMethodFunctionNames = function () {
            var ret = [];
            for (var i in omm.meteorMethodFunctions) {
                ret.push(i);
            }
            return ret;
        };
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
            return getMetadata("persistence:collectionName", f);
        };
        PersistenceAnnotation.isRootEntity = function (f) {
            return !!PersistenceAnnotation.getCollectionName(f);
        };
        PersistenceAnnotation.isEntity = function (f) {
            return !!omm.entityClasses[className(f)];
        };
        PersistenceAnnotation.getDocumentPropertyName = function (typeClass, objectPropertyName) {
            var documentNames = getMetadata("documentNames", typeClass.prototype);
            return documentNames ? documentNames[objectPropertyName] : undefined;
        };
        PersistenceAnnotation.getObjectPropertyName = function (typeClass, documentPropertyName) {
            var objectNames = getMetadata("objectNames", typeClass.prototype);
            return objectNames ? objectNames[documentPropertyName] : undefined;
        };
        PersistenceAnnotation.isArrayOrMap = function (f, propertyName) {
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "arrayOrMap"))
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return false;
        };
        PersistenceAnnotation.getPropertyClass = function (f, propertyName) {
            while (f != Object) {
                var className = PersistenceAnnotation.getPropertyProperty(f, propertyName, "type");
                if (className)
                    return PersistenceAnnotation.getEntityClassByName(className);
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return undefined;
        };
        PersistenceAnnotation.getTypedPropertyNames = function (f) {
            var result = [];
            while (f != Object) {
                var props = getMetadata("persistence:typedproperties", f);
                for (var i in props) {
                    if (PersistenceAnnotation.getPropertyClass(f, i))
                        result.push(i);
                }
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return result;
        };
        PersistenceAnnotation.setPropertyProperty = function (cls, propertyName, property, value) {
            var arr = getMetadata("persistence:typedproperties", cls);
            if (!arr) {
                arr = {};
                defineMetadata("persistence:typedproperties", arr, cls);
            }
            var propProps = arr[propertyName];
            if (!propProps) {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        };
        PersistenceAnnotation.getPropertyProperty = function (cls, propertyName, propertyProperty) {
            var arr = getMetadata("persistence:typedproperties", cls);
            if (arr && arr[propertyName]) {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        };
        PersistenceAnnotation.getParentClass = function (t) {
            return Object.getPrototypeOf(t.prototype).constructor;
        };
        PersistenceAnnotation.getIdPropertyName = function (t) {
            return omm.PersistenceAnnotation.getObjectPropertyName(t, "_id") || "_id";
        };
        PersistenceAnnotation.isStoredAsForeignKeys = function (f, propertyName) {
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "askeys"))
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return false;
        };
        PersistenceAnnotation.isIgnored = function (f, propertyName) {
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "ignore"))
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return false;
        };
        PersistenceAnnotation.isParent = function (f, propertyName) {
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "parent"))
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return false;
        };
        PersistenceAnnotation.getWrappedFunctionNames = function (f) {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        };
        PersistenceAnnotation.getCollectionUpdateOptions = function (cls, functionName) {
            return PersistenceAnnotation.getPropertyProperty(cls.prototype, functionName, "collectionUpdate");
        };
        PersistenceAnnotation.getCollectionUpdateFunctionNames = function (f) {
            var result = [];
            var props = getMetadata("persistence:typedproperties", f.prototype);
            for (var i in props) {
                if (PersistenceAnnotation.getCollectionUpdateOptions(f, i))
                    result.push(i);
            }
            return result;
        };
        PersistenceAnnotation.getPropertyNamesByMetaData = function (o, metaData) {
            var result = [];
            for (var i in o) {
                var value = o[i];
                if (typeof value == "function" && getMetadata(metaData, value))
                    result.push(i);
            }
            return result;
        };
        return PersistenceAnnotation;
    })();
    omm.PersistenceAnnotation = PersistenceAnnotation;
})(omm || (omm = {}));
(function () {
    var data;
    if (typeof global != "undefined") {
        if (!global["_omm_data"])
            global["_omm_data"] = {};
        data = global["_omm_data"];
    }
    else if (typeof window != "undefined") {
        if (!window["_omm_data"])
            window["_omm_data"] = {};
        data = window["_omm_data"];
    }
    else
        data = {};
    if (!data.entityClasses)
        data.entityClasses = {};
    omm.entityClasses = data.entityClasses;
    if (!data.registeredObjects)
        data.registeredObjects = {};
    omm.registeredObjects = data.registeredObjects;
    if (!data.meteorMethodFunctions)
        data.meteorMethodFunctions = {};
    omm.meteorMethodFunctions = data.meteorMethodFunctions;
})();
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
        ConstantObjectRetriever.prototype.preToDocument = function (o) { };
        ConstantObjectRetriever.prototype.postToObject = function (o) { };
        return ConstantObjectRetriever;
    })();
    omm.ConstantObjectRetriever = ConstantObjectRetriever;
})(omm || (omm = {}));
var omm;
(function (omm) {
    var SubObjectPath = (function () {
        function SubObjectPath(s) {
            this.path = s || "";
        }
        SubObjectPath.prototype.clone = function () {
            return new SubObjectPath(this.path);
        };
        SubObjectPath.prototype.forEachPathEntry = function (iterator) {
            if (this.path.length > 0)
                this.path.split(".").forEach(function (entry) {
                    var propertyName = entry;
                    var id = undefined;
                    if (entry.indexOf("|") != -1) {
                        propertyName = entry.split("|")[0];
                        id = entry.split("|")[1];
                    }
                    iterator(propertyName, id);
                });
        };
        SubObjectPath.prototype.getSubObject = function (rootObject) {
            var o = rootObject;
            this.forEachPathEntry(function (propertyName, id) {
                if (typeof o != "undefined") {
                    o = o[propertyName];
                    if (typeof o != "undefined" && typeof id != "undefined") {
                        var foundEntry = false;
                        for (var j in o) {
                            var arrayEntry = o[j];
                            if (omm.getId(arrayEntry) === id) {
                                o = arrayEntry;
                                foundEntry = true;
                                break;
                            }
                        }
                        if (!foundEntry) {
                            o = o[id];
                        }
                    }
                }
            });
            return o;
        };
        SubObjectPath.prototype.appendArrayOrMapLookup = function (name, id) {
            if (this.path.length > 0)
                this.path += ".";
            this.path += name + "|" + id;
        };
        SubObjectPath.prototype.appendPropertyLookup = function (name) {
            if (this.path.length > 0)
                this.path += ".";
            this.path += name;
        };
        SubObjectPath.prototype.toString = function () {
            return this.path;
        };
        return SubObjectPath;
    })();
    omm.SubObjectPath = SubObjectPath;
})(omm || (omm = {}));
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./Document.ts"/>
///<reference path="./SubObjectPath.ts"/>
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
                                var objectRetriever = this["_objectRetriever"];
                                if (typeof v == "string") {
                                    v = objectRetriever.getObject(v, this, propertyName);
                                    this[propertyName] = v;
                                }
                                else {
                                    for (var i in v) {
                                        var ele = v[i];
                                        v[i] = objectRetriever.getObject(ele, this, propertyName);
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
                else {
                }
            });
        };
        Serializer.forEachTypedObject = function (object, cb) {
            this.forEachTypedObjectRecursive(object, object, new omm.SubObjectPath(), [], cb);
        };
        Serializer.forEachTypedObjectRecursive = function (rootObject, object, path, visited, cb) {
            var that = this;
            if (visited.indexOf(object) != -1)
                return;
            if (!object || typeof object != "object")
                return;
            visited.push(object);
            cb(path, object);
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            omm.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
                if (!omm.PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    var v = object[typedPropertyName];
                    if (v) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            for (var i in v) {
                                var e = v[i];
                                var subObjectPath = path.clone();
                                if (typeof omm.getId(e) != "undefined") {
                                    subObjectPath.appendArrayOrMapLookup(typedPropertyName, omm.getId(e));
                                }
                                else {
                                    subObjectPath.appendArrayOrMapLookup(typedPropertyName, i);
                                }
                                cb(subObjectPath, e);
                                that.forEachTypedObjectRecursive(rootObject, e, subObjectPath, visited, cb);
                            }
                        }
                        else {
                            var subObjectPath = path.clone();
                            subObjectPath.appendPropertyLookup(typedPropertyName);
                            cb(subObjectPath, v);
                            that.forEachTypedObjectRecursive(rootObject, v, subObjectPath, visited, cb);
                        }
                    }
                }
            });
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
        Serializer.prototype.toObject = function (doc, f) {
            var o = this.toObjectRecursive(doc, undefined, f);
            this.objectRetriever.postToObject(o);
            return o;
        };
        Serializer.prototype.toObjectRecursive = function (doc, parent, f) {
            var o;
            if (!doc)
                return doc;
            if (typeof doc == "function")
                throw new Error("Error in 'toObject'. doc is a function.");
            if (f && typeof f["toObject"] == "function") {
                o = f["toObject"](doc);
            }
            else {
                if (doc.className)
                    f = omm.PersistenceAnnotation.getEntityClassByName(doc.className);
                if (!f)
                    throw new Error("Could not determine class of document. Either the document needs to have a 'className' property or a class needs to be passed to the serializer.");
                o = new f();
                for (var propertyName in doc) {
                    var value = doc[propertyName];
                    var objectNameOfTheProperty = omm.PersistenceAnnotation.getObjectPropertyName(f, propertyName);
                    if (!objectNameOfTheProperty)
                        objectNameOfTheProperty = propertyName;
                    var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                    var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);
                    var isParent = omm.PersistenceAnnotation.isParent(f, objectNameOfTheProperty);
                    if (isParent) {
                        if (!parent)
                            throw new Error("Could not find parent object");
                        else
                            o[objectNameOfTheProperty] = parent;
                    }
                    else if (propertyClass && !isStoredAsKeys) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                            var result = Array.isArray(value) ? [] : {};
                            for (var i in value) {
                                var entry = value[i];
                                entry = this.toObjectRecursive(entry, o, propertyClass);
                                result[i] = entry;
                            }
                            o[objectNameOfTheProperty] = result;
                        }
                        else {
                            o[objectNameOfTheProperty] = this.toObjectRecursive(value, o, propertyClass);
                        }
                    }
                    else {
                        o[objectNameOfTheProperty] = value;
                    }
                }
            }
            omm.setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
            return o;
        };
        Serializer.prototype.toDocument = function (object) {
            this.objectRetriever.preToDocument(object);
            return this.toDocumentRecursive(object);
        };
        Serializer.prototype.toDocumentRecursive = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var result;
            if (!object || typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
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
                var documentNameOfTheProperty = omm.PersistenceAnnotation.getDocumentPropertyName(objectClass, property);
                if (!documentNameOfTheProperty)
                    documentNameOfTheProperty = property;
                if (value !== undefined && !omm.PersistenceAnnotation.isIgnored(objectClass, property) && !omm.PersistenceAnnotation.isParent(objectClass, property)) {
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
                            doc[documentNameOfTheProperty] = result;
                        }
                        else if (typeof object[property] == 'object') {
                            doc[documentNameOfTheProperty] = this.toDocumentRecursive(value, rootClass, object, property);
                        }
                        else {
                            throw new Error("Unsupported type : " + typeof value);
                        }
                    }
                    else if (typeof value == 'function') {
                    }
                    else {
                        doc[documentNameOfTheProperty] = value;
                    }
                }
            }
            return doc;
        };
        return Serializer;
    })();
    omm.Serializer = Serializer;
})(omm || (omm = {}));
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./Document.ts"/>
///<reference path="./Serializer.ts"/>
///<reference path="./ObjectRetriever.ts"/>
var omm;
(function (omm) {
    var LocalObjectRetriever = (function () {
        function LocalObjectRetriever() {
        }
        LocalObjectRetriever.prototype.setQuietProperty = function (obj, propertyName, value) {
            if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
                Object.defineProperty(obj, propertyName, {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            obj[propertyName] = value;
        };
        LocalObjectRetriever.prototype.getId = function (o) {
            var p = o["localPath"];
            return p;
        };
        LocalObjectRetriever.prototype.getObject = function (s, parentObject, propertyName) {
            var subObjectPath = new omm.SubObjectPath(s);
            return subObjectPath.getSubObject(parentObject["rootObject"]);
        };
        LocalObjectRetriever.prototype.preToDocument = function (o) {
            var that = this;
            omm.Serializer.forEachTypedObject(o, function (path, subO) {
                that.setQuietProperty(subO, "localPath", path.toString());
            });
        };
        LocalObjectRetriever.prototype.postToObject = function (o) {
            var that = this;
            omm.Serializer.forEachTypedObject(o, function (path, o) {
                that.setQuietProperty(o, "rootObject", o);
            });
        };
        return LocalObjectRetriever;
    })();
    omm.LocalObjectRetriever = LocalObjectRetriever;
})(omm || (omm = {}));

module.exports = omm;
