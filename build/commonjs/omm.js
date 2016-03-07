var omm;
(function (omm) {
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
    function Entity(entityNameOrP1) {
        var entityName;
        if (typeof entityNameOrP1 == "string") {
            entityName = entityNameOrP1;
        }
        else {
            var n = entityNameOrP1.toString();
            n = n.substr('function '.length);
            n = n.substr(0, n.indexOf('('));
            entityName = n;
        }
        var f = function (p1) {
            var typeClass = p1;
            defineMetadata("persistence:entity", true, typeClass);
            omm.entityClasses[entityName] = typeClass;
            Object.defineProperty(p1, "_ommClassName", {
                value: entityName,
                writable: false,
                configurable: false,
                enumerable: false
            });
        };
        if (typeof entityNameOrP1 == "string") {
            return f;
        }
        else {
            f(entityNameOrP1);
        }
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
    function wrap(t, functionName) {
        omm.collectionUpdate(t, functionName);
        omm.MeteorMethod({ replaceWithCall: true })(t, functionName, undefined);
    }
    omm.wrap = wrap;
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
        return typeof fun == "function" ? fun['_ommClassName'] : undefined;
    }
    omm.className = className;
    function MeteorMethod(p1, p2) {
        if (typeof p1 == "object" && typeof p2 == "string") {
            var options = { isStatic: false };
            options.parentObject = p1;
            options.functionName = p2;
            options.name = p2;
            omm.meteorMethodFunctions.push(options);
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
                    options.name = functionName;
                }
                omm.meteorMethodFunctions.push(options);
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
                options.name = p2;
            omm.meteorMethodFunctions.push(options);
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
                    options.name = functionName;
                omm.meteorMethodFunctions.push(options);
            };
        }
    }
    omm.StaticMeteorMethod = StaticMeteorMethod;
    var PersistenceAnnotation = (function () {
        function PersistenceAnnotation() {
        }
        PersistenceAnnotation.getMethodOptions = function (functionName) {
            for (var i = 0; i < omm.meteorMethodFunctions.length; i++) {
                if (omm.meteorMethodFunctions[i].name == functionName)
                    return omm.meteorMethodFunctions[i];
            }
            return undefined;
        };
        PersistenceAnnotation.getMethodFunctionNames = function (c) {
            var ret = [];
            for (var i = 0; i < omm.meteorMethodFunctions.length; i++) {
                var methodOptions = omm.meteorMethodFunctions[i];
                if (methodOptions.parentObject == c)
                    ret.push(methodOptions.name);
            }
            return ret;
        };
        PersistenceAnnotation.getMethodFunctionNamesByObject = function (o) {
            var ret = [];
            for (var i = 0; i < omm.meteorMethodFunctions.length; i++) {
                var methodOptions = omm.meteorMethodFunctions[i];
                if (methodOptions.object == o)
                    ret.push(omm.meteorMethodFunctions[i].name);
            }
            return ret;
        };
        PersistenceAnnotation.getAllMethodFunctionNames = function () {
            var ret = [];
            for (var i = 0; i < omm.meteorMethodFunctions.length; i++) {
                ret.push(omm.meteorMethodFunctions[i].name);
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
        PersistenceAnnotation.getParentPropertyNames = function (f) {
            var result = [];
            while (f != Object) {
                var props = getMetadata("persistence:typedproperties", f);
                for (var i in props) {
                    if (PersistenceAnnotation.isParent(f, i))
                        result.push(i);
                }
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return result;
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
        data.meteorMethodFunctions = [];
    omm.meteorMethodFunctions = data.meteorMethodFunctions;
    if (!data.eventListeners)
        data.eventListeners = {};
    omm.eventListeners = data.eventListeners;
})();
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
            var o;
            if (Array.isArray(doc)) {
                var r = [];
                for (var j = 0; j < doc.length; j++) {
                    r[j] = this.toObjectRecursive(doc[j], undefined, f);
                }
                o = r;
            }
            else if (!doc || typeof doc == "string" || typeof doc == "number" || typeof doc == "date" || typeof doc == "boolean")
                o = doc;
            else
                o = this.toObjectRecursive(doc, undefined, f);
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
                    throw new Error("Could not determine class of document. Either the document needs to have a 'className' property or a class needs to be passed to the serializer. Document: " + JSON.stringify(doc));
                o = new f();
                for (var propertyName in doc) {
                    var value = doc[propertyName];
                    var objectNameOfTheProperty = omm.PersistenceAnnotation.getObjectPropertyName(f, propertyName);
                    if (!objectNameOfTheProperty)
                        objectNameOfTheProperty = propertyName;
                    var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                    var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);
                    if (propertyClass && !isStoredAsKeys) {
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
                omm.PersistenceAnnotation.getParentPropertyNames(f).forEach(function (parentPropertyName) {
                    o[parentPropertyName] = parent;
                });
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
            else if (Array.isArray(object)) {
                result = [];
                for (var i = 0; i < object.length; i++) {
                    result[i] = this.toDocumentRecursive(object[i]);
                }
            }
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
                                if (arrayEntry.getId && arrayEntry.getId() == id) {
                                    o = arrayEntry;
                                    foundEntry = true;
                                    break;
                                }
                            }
                            if (!foundEntry) {
                                if (arrayOrMap[id])
                                    o = arrayOrMap[id];
                                else
                                    o = undefined;
                            }
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
var omm;
(function (omm) {
    var MeteorObjectRetriever = (function () {
        function MeteorObjectRetriever() {
        }
        MeteorObjectRetriever.prototype.getId = function (object) {
            if (object._serializationPath)
                return object._serializationPath.toString();
            else {
                var objectClass = omm.PersistenceAnnotation.getClass(object);
                var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(objectClass);
                var id = object[idPropertyName];
                if (omm.PersistenceAnnotation.isRootEntity(objectClass) && id) {
                    return new omm.SerializationPath(this, omm.PersistenceAnnotation.getCollectionName(objectClass), id).toString();
                }
                else {
                    throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
                }
            }
        };
        MeteorObjectRetriever.prototype.getObject = function (s) {
            if (typeof s != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath(this, s);
            var collectionName = sPath.getCollectionName();
            var collection = collectionName ? omm.MeteorPersistence.collections[collectionName] : undefined;
            if (collection) {
                var rootValue = collection.getById(sPath.getId());
                var newValue = rootValue ? sPath.getSubObject(rootValue) : undefined;
                return newValue;
            }
            else
                throw new Error("No collection found to retrieve object. Key:" + s);
        };
        MeteorObjectRetriever.prototype.preToDocument = function (o) {
        };
        MeteorObjectRetriever.prototype.postToObject = function (o) {
            this.updateSerializationPaths(o);
            this.retrieveLocalKeys(o);
        };
        MeteorObjectRetriever.prototype.setSerializationPath = function (o, pPath) {
            omm.setNonEnumerableProperty(o, "_serializationPath", pPath);
            omm.setNonEnumerableProperty(o, "_objectRetriever", this);
        };
        MeteorObjectRetriever.prototype.updateSerializationPaths = function (object, visited) {
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
                    var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(objectClass);
                    var id = object[idPropertyName];
                    if (id)
                        this.setSerializationPath(object, new omm.SerializationPath(this, omm.PersistenceAnnotation.getCollectionName(objectClass), id));
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
                                if (e) {
                                    var index = i;
                                    if (omm.getId(e))
                                        index = omm.getId(e);
                                    that.setSerializationPath(e, object._serializationPath.clone());
                                    e._serializationPath.appendArrayOrMapLookup(typedPropertyName, index);
                                    that.updateSerializationPaths(e, visited);
                                }
                            }
                        }
                        else {
                            that.setSerializationPath(v, object._serializationPath.clone());
                            v._serializationPath.appendPropertyLookup(typedPropertyName);
                            that.updateSerializationPaths(v, visited);
                        }
                    }
                }
                else {
                    if (!omm.Serializer.needsLazyLoading(object, typedPropertyName)) {
                        var v = object[typedPropertyName];
                        if (v) {
                            if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (e && !e._serializationPath) {
                                        that.updateSerializationPaths(e, visited);
                                    }
                                }
                            }
                            else if (!v._serializationPath)
                                that.updateSerializationPaths(v, visited);
                        }
                    }
                }
            });
        };
        MeteorObjectRetriever.prototype.retrieveLocalKeys = function (o, visited, rootObject) {
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
                        var pp = new omm.SerializationPath(this, key);
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
        return MeteorObjectRetriever;
    })();
    omm.MeteorObjectRetriever = MeteorObjectRetriever;
})(omm || (omm = {}));
var omm;
(function (omm) {
    var CallHelper = (function () {
        function CallHelper(o, cb) {
            this.object = o;
            this.callback = cb;
        }
        return CallHelper;
    })();
    omm.CallHelper = CallHelper;
    function registerObject(key, o) {
        omm.registeredObjects[key] = o;
    }
    omm.registerObject = registerObject;
    function getRegisteredObject(key) {
        return omm.registeredObjects[key];
    }
    omm.getRegisteredObject = getRegisteredObject;
    function callHelper(o, callback) {
        var helper = {};
        var c = omm.PersistenceAnnotation.getClass(o);
        omm.PersistenceAnnotation.getMethodFunctionNames(c.prototype).forEach(function (functionName) {
            var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
            helper[methodOptions.functionName] = function () {
                var originalArguments = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    originalArguments[_i - 0] = arguments[_i];
                }
                var args = [];
                for (var i in originalArguments) {
                    if ((typeof originalArguments[i] == "object") && originalArguments[i] && originalArguments[i]._serializationPath) {
                        args[i] = originalArguments[i]._serializationPath.toString();
                    }
                    else {
                        args[i] = omm.MeteorPersistence.serializer.toDocument(originalArguments[i]);
                    }
                }
                var callOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
                if (!callOptions.object) {
                    var id = omm.MeteorPersistence.meteorObjectRetriever.getId(o);
                    args.splice(0, 0, id);
                }
                args.splice(0, 0, methodOptions.name);
                args.push(function (err, result) {
                    if (result)
                        result = omm.MeteorPersistence.serializer.toObject(result, callOptions.resultType ? omm.entityClasses[callOptions.resultType] : undefined);
                    if (err && err instanceof Meteor.Error)
                        err = err.error;
                    if (callback)
                        callback(err, result);
                });
                Meteor.call.apply(this, args);
            };
        });
        return helper;
    }
    omm.callHelper = callHelper;
    function staticCallHelper(tc, callback) {
        var helper = {};
        var className = omm.className(tc);
        omm.PersistenceAnnotation.getMethodFunctionNamesByObject(tc).forEach(function (functionName) {
            var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
            var methodName = methodOptions.name;
            if (!methodName)
                methodName = functionName;
            helper[methodOptions.functionName] = function () {
                var originalArguments = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    originalArguments[_i - 0] = arguments[_i];
                }
                var args = [];
                for (var i in originalArguments) {
                    if ((typeof originalArguments[i] == "object") && originalArguments[i] && originalArguments[i]._serializationPath) {
                        args[i] = originalArguments[i]._serializationPath.toString();
                    }
                    else {
                        args[i] = omm.MeteorPersistence.serializer.toDocument(originalArguments[i]);
                    }
                }
                args.splice(0, 0, methodName);
                args.push(function (err, result) {
                    if (result)
                        result = omm.MeteorPersistence.serializer.toObject(result, methodOptions.resultType ? omm.entityClasses[methodOptions.resultType] : undefined);
                    if (err && err instanceof Meteor.Error)
                        err = err.error;
                    if (callback)
                        callback(err, result);
                });
                Meteor.call.apply(this, args);
            };
        });
        return helper;
    }
    omm.staticCallHelper = staticCallHelper;
    function call(meteorMethodName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var i in args) {
            if (args[i]._serializationPath) {
                args[i] = args[i]._serializationPath.toString();
            }
            else if (typeof args[i] != "function") {
                args[i] = omm.MeteorPersistence.serializer.toDocument(args[i]);
            }
        }
        if (args.length > 0 && (typeof args[args.length - 1] == "function")) {
            var orignalCallback = args[args.length - 1];
            args[args.length - 1] = function (err, result) {
                if (result)
                    result = omm.MeteorPersistence.serializer.toObject(result);
                if (err && err instanceof Meteor.Error)
                    err = err.error;
                orignalCallback(err, result);
            };
        }
        args.splice(0, 0, meteorMethodName);
        Meteor.call.apply(this, args);
    }
    omm.call = call;
    var MeteorPersistence = (function () {
        function MeteorPersistence() {
        }
        MeteorPersistence.init = function () {
            if (!MeteorPersistence.initialized) {
                MeteorPersistence.meteorObjectRetriever = new omm.MeteorObjectRetriever();
                MeteorPersistence.serializer = new omm.Serializer(MeteorPersistence.meteorObjectRetriever);
                omm.Serializer.init();
                omm.PersistenceAnnotation.getEntityClasses().forEach(function (c) {
                    MeteorPersistence.wrapClass(c);
                });
                omm.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function (functionName) {
                    var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
                    omm.MeteorPersistence.createMeteorMethod(methodOptions);
                });
                MeteorPersistence.initialized = true;
            }
        };
        MeteorPersistence.objectsClassName = function (o) {
            return omm.className(o.constructor);
        };
        MeteorPersistence.createMeteorMethod = function (options) {
            var meteorMethodName = options.name;
            var isStatic = options.isStatic;
            var staticObject = options.object;
            var parameterClassNames = options.parameterTypes;
            var originalFunction = options.parentObject[options.functionName];
            if (Meteor.isServer || typeof options.serverOnly == "undefined" || !options.serverOnly) {
                var m = {};
                m[meteorMethodName] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    omm.methodContext = this;
                    check(args, Array);
                    omm.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object;
                        if (!isStatic) {
                            if (!staticObject) {
                                if (args.length == 0)
                                    throw new Error('Error calling meteor method ' + meteorMethodName + ': id or static object required');
                                var id = args[0];
                                if (typeof id != "string")
                                    throw new Error('Error calling meteor method ' + meteorMethodName + ': id is not of type string.');
                                if (options.parentObject && options.parentObject.constructor) {
                                    var className = omm.className(options.parentObject.constructor);
                                    if (omm.PersistenceAnnotation.getEntityClassByName(className) && id.indexOf("[") == -1)
                                        id = className + "[" + id + "]";
                                }
                                object = omm.MeteorPersistence.meteorObjectRetriever.getObject(id);
                                args.splice(0, 1);
                            }
                            else {
                                if (typeof staticObject == "string")
                                    object = omm.getRegisteredObject(staticObject);
                                else
                                    object = staticObject;
                            }
                            if (!object)
                                throw new Error('Error calling meteor method ' + meteorMethodName + ':Unable to retrieve object by id: ' + id);
                        }
                        var callbackIndex = -1;
                        for (var i = 0; i < args.length; i++) {
                            if (parameterClassNames && parameterClassNames.length > i) {
                                var cls = omm.PersistenceAnnotation.getEntityClassByName(parameterClassNames[i]);
                                if (cls) {
                                    if (typeof args[i] == "string")
                                        args[i] = omm.MeteorPersistence.meteorObjectRetriever.getObject(args[i]);
                                    else if (typeof args[i] == "object")
                                        args[i] = omm.MeteorPersistence.serializer.toObject(args[i], cls);
                                }
                                else if (parameterClassNames[i] == "callback")
                                    callbackIndex = i;
                            }
                        }
                        var result;
                        if (callbackIndex != -1) {
                            var syncFunction = Meteor.wrapAsync(function (cb) {
                                args[callbackIndex] = function (error, result) {
                                    if (error)
                                        throw new Meteor.Error(error);
                                    else
                                        cb(undefined, result);
                                };
                                originalFunction.apply(object, args);
                            });
                            result = syncFunction();
                        }
                        else {
                            result = originalFunction.apply(object, args);
                        }
                        var doc = omm.MeteorPersistence.serializer.toDocument(result);
                        if (Array.isArray(result)) {
                            for (var ri = 0; ri < result.length; ri++) {
                                var t = omm.PersistenceAnnotation.getClass(result[ri]);
                                if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t)))
                                    doc[ri].className = omm.className(t);
                            }
                        }
                        else {
                            var t = omm.PersistenceAnnotation.getClass(result);
                            if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t))) {
                                doc.className = omm.className(t);
                            }
                        }
                        return doc;
                    }
                    finally {
                        omm.MeteorPersistence.wrappedCallInProgress = false;
                    }
                };
                Meteor.methods(m);
            }
            if (options.replaceWithCall) {
                omm.MeteorPersistence.monkeyPatch(options.parentObject, options.functionName, function (originalFunction) {
                    var a = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        a[_i - 1] = arguments[_i];
                    }
                    if (!omm.MeteorPersistence.updateInProgress && (this._serializationPath || options.isStatic || (options.object && typeof options.object == "string"))) {
                        var args = [];
                        args.push(options.name);
                        if (!options.isStatic && !options.object) {
                            var id = omm.MeteorPersistence.meteorObjectRetriever.getId(this);
                            if (id)
                                args.push(id);
                        }
                        var callbackIndex = -1;
                        var cb;
                        for (var i = 0; i < a.length; i++) {
                            if (parameterClassNames && parameterClassNames.length > i) {
                                if (parameterClassNames[i] == "callback") {
                                    callbackIndex = 1;
                                    cb = a[i];
                                    a[i] = "OMM_CALLBACK_PLACEHOLDER";
                                }
                            }
                        }
                        a.push(function (error, result) {
                            if (error && error instanceof Meteor.Error)
                                error = error.error;
                            if (cb)
                                cb(error, result);
                        });
                        args = args.concat(a);
                        omm.call.apply(undefined, args);
                    }
                    else {
                        return originalFunction.apply(this, a);
                    }
                });
            }
        };
        MeteorPersistence.wrapClass = function (entityClass) {
            var that = this;
            omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function (functionName) {
                MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    var _serializationPath = this._serializationPath;
                    var updateCollection = true;
                    var resetUpdateCollection = false;
                    if (!MeteorPersistence.updateInProgress) {
                        omm.MeteorPersistence.updateInProgress = true;
                        omm.resetQueue();
                        resetUpdateCollection = true;
                    }
                    else {
                        updateCollection = false;
                    }
                    var object;
                    var collection;
                    if (_serializationPath) {
                        collection = omm.MeteorPersistence.collections[_serializationPath.getCollectionName()];
                        object = collection.getById(_serializationPath.getId());
                    }
                    else {
                        object = this;
                        updateCollection = false;
                    }
                    var ctx = new omm.EventContext(this, collection);
                    ctx.methodContext = omm.methodContext;
                    ctx.functionName = functionName;
                    ctx.serializationPath = _serializationPath;
                    ctx.rootObject = object;
                    omm.callEventListeners(entityClass, "pre:" + functionName, ctx);
                    omm.callEventListeners(entityClass, "pre", ctx);
                    if (ctx.cancelledWithError()) {
                        if (resetUpdateCollection) {
                            omm.MeteorPersistence.updateInProgress = false;
                        }
                    }
                    else {
                        var result;
                        if (updateCollection) {
                            result = collection.update(_serializationPath.getId(), function (o) {
                                var subObject = _serializationPath.getSubObject(o);
                                var r2 = originalFunction.apply(subObject, args);
                                return r2;
                            });
                        }
                        else {
                            result = originalFunction.apply(this, args);
                        }
                        if (resetUpdateCollection) {
                            omm.MeteorPersistence.updateInProgress = false;
                        }
                        var ctx = new omm.EventContext(this, collection);
                        ctx.preUpdate = object;
                        ctx.methodContext = omm.methodContext;
                        ctx.functionName = functionName;
                        ctx.serializationPath = _serializationPath;
                        ctx.rootObject = object;
                        if (omm._queue) {
                            omm._queue.forEach(function (t) {
                                omm.callEventListeners(entityClass, t.topic, ctx, t.data);
                            });
                        }
                        omm.callEventListeners(entityClass, "post:" + functionName, ctx);
                        omm.callEventListeners(entityClass, "post", ctx);
                        if (resetUpdateCollection) {
                            omm.deleteQueue();
                        }
                        return result;
                    }
                });
            });
        };
        MeteorPersistence.getClassName = function (o) {
            if (typeof o == "object" && omm.PersistenceAnnotation.getClass(o)) {
                return omm.className(omm.PersistenceAnnotation.getClass(o));
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
        };
        MeteorPersistence.collections = {};
        MeteorPersistence.wrappedCallInProgress = false;
        MeteorPersistence.updateInProgress = false;
        MeteorPersistence.initialized = false;
        return MeteorPersistence;
    })();
    omm.MeteorPersistence = MeteorPersistence;
})(omm || (omm = {}));
Meteor.startup(function () {
    omm.MeteorPersistence.init();
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm;
(function (omm) {
    var Collection = (function () {
        function Collection(entityClass, collectionName) {
            this.eventListeners = {};
            this.objectRetriever = new omm.MeteorObjectRetriever();
            this.serializer = new omm.Serializer(this.objectRetriever);
            if (!collectionName)
                collectionName = omm.getDefaultCollectionName(entityClass);
            omm.addCollectionRoot(entityClass, collectionName);
            this.name = collectionName;
            if (!omm.MeteorPersistence.collections[collectionName]) {
                omm.MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = Collection._getMeteorCollection(collectionName);
            this.theClass = entityClass;
        }
        Collection.prototype.removeAllListeners = function () {
            this.eventListeners = {};
        };
        Collection.prototype.preSave = function (f) {
            this.addListener("preSave", f);
        };
        Collection.prototype.onRemove = function (f) {
            this.addListener("didRemove", f);
        };
        Collection.prototype.preRemove = function (f) {
            this.addListener("willRemove", f);
        };
        Collection.prototype.onInsert = function (f) {
            this.addListener("didInsert", f);
        };
        Collection.prototype.preInsert = function (f) {
            this.addListener("willInsert", f);
        };
        Collection.prototype.addListener = function (topic, f) {
            if (!this.eventListeners[topic])
                this.eventListeners[topic] = [];
            this.eventListeners[topic].push(f);
        };
        Collection.prototype.emit = function (topic, data) {
            if (this.queue)
                this.queue.push({ topic: topic, data: data });
        };
        Collection.prototype.emitNow = function (t, evtCtx, data) {
            if (this.eventListeners[t]) {
                this.eventListeners[t].forEach(function (listener) {
                    listener(evtCtx, data);
                });
            }
        };
        Collection.prototype.flushQueue = function () {
            if (this.queue) {
                this.queue.forEach(function (evt) {
                    this.emitNow(evt.topic, evt.data);
                });
                this.queue = undefined;
            }
        };
        Collection.prototype.resetQueue = function () {
            this.queue = [];
        };
        Collection._getMeteorCollection = function (name) {
            if (!Collection.meteorCollections[name]) {
                if (name != "users") {
                    Collection.meteorCollections[name] = new Mongo.Collection(name);
                }
                else
                    Collection.meteorCollections[name] = Meteor.users;
            }
            return Collection.meteorCollections[name];
        };
        Collection.prototype.getName = function () {
            return this.name;
        };
        Collection.prototype.getMeteorCollection = function () {
            return this.meteorCollection;
        };
        Collection.prototype.getById = function (id) {
            var o = this.find({
                "_id": id
            });
            return o.length > 0 ? o[0] : undefined;
        };
        Collection.prototype.find = function (findCriteria) {
            var documents = this.meteorCollection.find(findCriteria).fetch();
            var objects = [];
            for (var i = 0; i < documents.length; i++) {
                var document = documents[i];
                objects[i] = this.documentToObject(document);
            }
            return objects;
        };
        Collection.prototype.getAll = function () {
            return this.find({});
        };
        Collection.prototype.remove = function (id, cb) {
            var ctx = new omm.EventContext(o, this);
            ctx.methodContext = omm.methodContext;
            this.emitNow("willRemove", ctx);
            if (ctx.cancelledWithError()) {
                if (cb)
                    cb(ctx.cancelledWithError());
            }
            else {
                if (id) {
                    this.meteorCollection.remove(id, cb);
                    var o = this.getById(id);
                    var c2 = new omm.EventContext(o, this);
                    c2.methodContext = omm.methodContext;
                    this.emitNow("didRemove", c2);
                }
                else
                    throw new Error("Trying to remove an object that does not have an id.");
            }
        };
        Collection.prototype.documentToObject = function (doc) {
            var p = this.serializer.toObject(doc, this.theClass);
            this.objectRetriever.updateSerializationPaths(p);
            this.objectRetriever.retrieveLocalKeys(p);
            return p;
        };
        Collection.prototype.update = function (id, updateFunction) {
            omm.MeteorPersistence.updateInProgress = true;
            try {
                if (!id)
                    throw new Error("Id missing");
                for (var i = 0; i < 10; i++) {
                    omm.resetQueue();
                    var document = this.meteorCollection.findOne({
                        _id: id
                    });
                    if (!document) {
                        throw new Error("No document found for id: " + id);
                    }
                    var currentSerial = document.serial;
                    var object = this.documentToObject(document);
                    var result = updateFunction(object);
                    this.objectRetriever.updateSerializationPaths(object);
                    var ctx = new omm.EventContext(object, this);
                    omm.callEventListeners(this.getEntityClass(), "preSave", ctx);
                    var documentToSave = this.serializer.toDocument(object);
                    documentToSave.serial = currentSerial + 1;
                    var updatedDocumentCount = this.meteorCollection.update({
                        _id: id,
                        serial: currentSerial
                    }, documentToSave);
                    if (updatedDocumentCount == 1) {
                        return result;
                    }
                    else if (updatedDocumentCount > 1)
                        throw new Meteor.Error("verifiedUpdate should only update one document");
                    else {
                    }
                }
                throw new Error("update gave up after 10 attempts to update the object ");
            }
            finally {
                omm.MeteorPersistence.updateInProgress = false;
            }
        };
        Collection.prototype.insert = function (p, callback) {
            var ctx = new omm.EventContext(p, this);
            ctx.methodContext = omm.methodContext;
            this.emitNow("willInsert", ctx);
            if (ctx.cancelledWithError()) {
                if (callback)
                    callback(ctx.cancelledWithError());
                return undefined;
            }
            else {
                var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(this.theClass);
                if (!p[idPropertyName])
                    p[idPropertyName] = new Mongo.ObjectID()._str;
                var doc = this.serializer.toDocument(p);
                doc.serial = 0;
                var that = this;
                function afterwards(e, id) {
                    if (!e) {
                        p[idPropertyName] = id;
                        that.objectRetriever.postToObject(p);
                    }
                    else {
                    }
                    var ctx2 = new omm.EventContext(that.getById(id), this);
                    ctx2.methodContext = omm.methodContext;
                    that.emitNow("didInsert", ctx2);
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
        };
        Collection.resetAll = function (cb) {
            var arr = [];
            for (var i in Collection.meteorCollections)
                arr.push(Collection.meteorCollections[i]);
            if (arr.length > 0) {
                for (var j in arr) {
                    if (parseInt(j) != arr.length - 1)
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
        Collection.prototype.getEntityClass = function () {
            return this.theClass;
        };
        Collection.meteorCollections = {};
        __decorate([
            omm.StaticMeteorMethod({ replaceWithCall: true, parameterTypes: ['callback'] })
        ], Collection, "resetAll", null);
        return Collection;
    })();
    omm.Collection = Collection;
})(omm || (omm = {}));
var omm;
(function (omm) {
    var EventContext = (function () {
        function EventContext(o, coll) {
            this.cancelledError = false;
            this.object = o;
            this.collection = coll;
        }
        EventContext.prototype.cancel = function (err) {
            this.cancelledError = err;
        };
        EventContext.prototype.cancelledWithError = function () {
            return this.cancelledError;
        };
        return EventContext;
    })();
    omm.EventContext = EventContext;
    function on(t, topic, f) {
        var className = omm.className(t);
        if (typeof topic == "function") {
            f = topic;
            topic = null;
        }
        var e = omm.PersistenceAnnotation.getEntityClassByName(className);
        if (!e)
            throw new Error("Type is not an entity");
        if (!omm.eventListeners[className]) {
            omm.eventListeners[className] = {};
        }
        if (topic) {
            if (!omm.eventListeners[className][topic])
                omm.eventListeners[className][topic] = [];
            omm.eventListeners[className][topic].push(f);
        }
        else {
            if (!omm.eventListeners[className]["_all"])
                omm.eventListeners[className]["_all"] = [];
            omm.eventListeners[className]["_all"].push(f);
        }
    }
    omm.on = on;
    function onUpdate(t, functionName, f) {
        var className = omm.className(t);
        if (typeof functionName == "function") {
            f = functionName;
            functionName = null;
        }
        var e = omm.PersistenceAnnotation.getEntityClassByName(className);
        if (!e)
            throw new Error("Type is not an entity");
        if (functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(functionName) == -1)
            throw new Error("Function '" + functionName + "' is not a collection update function");
        if (!omm.eventListeners[className]) {
            omm.eventListeners[className] = {};
        }
        var topic = "post" + (functionName ? ":" + functionName : "");
        if (!omm.eventListeners[className][topic])
            omm.eventListeners[className][topic] = [];
        omm.eventListeners[className][topic].push(f);
    }
    omm.onUpdate = onUpdate;
    function preUpdate(t, functionName, f) {
        var className = omm.className(t);
        if (typeof functionName == "function") {
            f = functionName;
            functionName = null;
        }
        var e = omm.PersistenceAnnotation.getEntityClassByName(className);
        if (!e)
            throw new Error("Type is not an entity");
        if (functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(functionName) == -1)
            throw new Error("Function '" + functionName + "' is not a collection update function ");
        if (!omm.eventListeners[className]) {
            omm.eventListeners[className] = {};
        }
        var topic = "pre" + (typeof functionName == "string" ? ":" + functionName : "");
        console.log("topic:" + topic);
        if (!omm.eventListeners[className][topic])
            omm.eventListeners[className][topic] = [];
        omm.eventListeners[className][topic].push(f);
    }
    omm.preUpdate = preUpdate;
    function callEventListeners(t, topic, ctx, data) {
        var className = omm.className(t);
        ctx.topic = topic;
        if (className && omm.eventListeners[className] && omm.eventListeners[className][topic]) {
            omm.eventListeners[className][topic].forEach(function (el) {
                el(ctx, data);
            });
        }
        if (topic.indexOf("pre:") != 0 && topic != "pre" && topic.indexOf("post:") != 0 && topic != "post" && className && omm.eventListeners[className] && omm.eventListeners[className]["_all"]) {
            omm.eventListeners[className]["_all"].forEach(function (el) {
                el(ctx, data);
            });
        }
    }
    omm.callEventListeners = callEventListeners;
    function removeAllUpdateEventListeners() {
        for (var i in omm.eventListeners)
            delete omm.eventListeners[i];
    }
    omm.removeAllUpdateEventListeners = removeAllUpdateEventListeners;
    function resetQueue() {
        omm._queue = [];
    }
    omm.resetQueue = resetQueue;
    function emit(topic, data) {
        if (omm._queue) {
            omm._queue.push({
                topic: topic,
                data: data
            });
        }
        else {
        }
    }
    omm.emit = emit;
    function deleteQueue() {
        omm._queue = undefined;
    }
    omm.deleteQueue = deleteQueue;
})(omm || (omm = {}));
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
