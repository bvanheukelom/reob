"use strict";
class EventContext {
    constructor(o, coll /*omm.Collection<T>*/) {
        this.cancelledError = false;
        this.object = o;
        if (o)
            this.objectId = getId(o);
        this.collection = coll;
    }
    cancel(err) {
        this.cancelledError = err;
    }
    cancelledWithError() {
        return this.cancelledError;
    }
}
exports.EventContext = EventContext;
function isRegisteredWithKey(o) {
    for (var i in exports.registeredObjects) {
        if (exports.registeredObjects[i] === o) {
            return i;
        }
    }
    return undefined;
}
exports.isRegisteredWithKey = isRegisteredWithKey;
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
exports.setNonEnumerableProperty = setNonEnumerableProperty;
// it seems that the local variable that "reflect" uses is prone to the same difficulties when it gets loaded
// multiple times. This is why it's been removed until it is supported by the Runtime directly.
function defineMetadata(propertyName, value, cls) {
    if (!cls.hasOwnProperty("_ommAnnotations")) {
        setNonEnumerableProperty(cls, "_ommAnnotations", {});
    }
    var _ommAnnotations = cls._ommAnnotations;
    _ommAnnotations[propertyName] = value;
}
exports.defineMetadata = defineMetadata;
function getMetadata(propertyName, cls) {
    if (cls.hasOwnProperty("_ommAnnotations"))
        return cls["_ommAnnotations"][propertyName];
    else {
        return undefined;
    }
}
exports.getMetadata = getMetadata;
function Entity(entityNameOrP1) {
    var entityName;
    if (typeof entityNameOrP1 == "string") {
        entityName = entityNameOrP1;
    }
    else {
        if (entityNameOrP1.name) {
            entityName = entityNameOrP1.name;
        }
        else {
            var n = entityNameOrP1.toString();
            n = n.substr('function '.length);
            n = n.substr(0, n.indexOf('('));
            entityName = n;
        }
    }
    var f = function (p1) {
        var typeClass = p1;
        defineMetadata("persistence:entity", true, typeClass);
        console.log("Adding entity ", entityName);
        exports.entityClasses[entityName] = typeClass;
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
exports.Entity = Entity;
/**
 * Declares a class as an entity.
 * @param c {function} The constructor function of the entity class.
 * @memberof omm
 */
function addEntity(c) {
    Entity(c);
}
exports.addEntity = addEntity;
function getDefaultCollectionName(t) {
    return className(t);
}
exports.getDefaultCollectionName = getDefaultCollectionName;
function addCollectionRoot(t, collectionName) {
    defineMetadata("persistence:collectionName", collectionName, t);
}
exports.addCollectionRoot = addCollectionRoot;
function Wrap(t, functionName, objectDescriptor) {
    //CollectionUpdate(t,functionName,objectDescriptor);
    //MeteorMethod(t,functionName,objectDescriptor);
    //defineMetadata("persistence:wrap", true, (<any>t)[functionName] );
    CollectionUpdate(t, functionName);
    MeteorMethod({ replaceWithCall: true })(t, functionName, objectDescriptor);
}
exports.Wrap = Wrap;
// js api
function wrap(t, functionName) {
    collectionUpdate(t, functionName);
    MeteorMethod({ replaceWithCall: true })(t, functionName, undefined);
}
exports.wrap = wrap;
function CollectionUpdate(p1, fName) {
    var options = {};
    console.log("registering a collection update on property", fName, p1);
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
exports.CollectionUpdate = CollectionUpdate;
/**
 * Used to declare a function of a class as a "collection update". That means that whenever the function is called
 * the same operation is also invoked on the document in the collection.
 * @param c {function} The constructor function of the entity class.
 * @param functionName {string} The name of the function that is declared as a "collection update".
 * @param options
 * @memberof omm
 */
function collectionUpdate(c, functionName, options) {
    if (!options) {
        CollectionUpdate(c, functionName);
    }
    else {
        CollectionUpdate(options)(c, functionName);
    }
}
exports.collectionUpdate = collectionUpdate;
function ArrayOrMap(typeClassName) {
    return function (targetPrototypeObject, propertyName) {
        // console.log("  "+propertyName+" as collection of "+typeClassName);
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "arrayOrMap", true);
    };
}
exports.ArrayOrMap = ArrayOrMap;
function ArrayType(typeClassName) {
    return ArrayOrMap(typeClassName);
}
exports.ArrayType = ArrayType;
/**
 * Declares the type of the values in the array. This is synonymous to {@link dictionaryType}.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the array property.
 * @param typeClassName {string} The classname of the entity that the array contains.
 * @memberof omm
 */
function arrayType(c, propertyName, typeClassName) {
    ArrayOrMap(typeClassName)(c.prototype, propertyName);
}
exports.arrayType = arrayType;
function DictionaryType(typeClassName) {
    return ArrayOrMap(typeClassName);
}
exports.DictionaryType = DictionaryType;
/**
 * Declares the type of the values in the dictionary. This is synonymous to {@link arrayType}.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the array property.
 * @param typeClassName {string} The classname of the entity that the array contains.
 * @memberof omm
 */
function dictionaryType(typeClassName) {
    return ArrayOrMap(typeClassName);
}
exports.dictionaryType = dictionaryType;
// export function AsForeignKeys(targetPrototypeObject:any, propertyName:string) {
//     return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "askeys", true);
// }
function Id(targetPrototypeObject, propertyName) {
    DocumentName("_id")(targetPrototypeObject, propertyName);
}
exports.Id = Id;
function Parent(targetPrototypeObject, propertyName) {
    PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "parent", 1);
}
exports.Parent = Parent;
/**
 * Used to declare which property is used as the value for "_id".
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the id property.
 * @memberof omm
 */
function idProperty(c, propertyName) {
    Id(c.prototype, propertyName);
}
exports.idProperty = idProperty;
function Ignore(targetPrototypeObject, propertyName) {
    PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "ignore", true);
}
exports.Ignore = Ignore;
/**
 * Declares that a property of an entity is not persisted.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the id property.
 * @memberof omm
 */
function ignoreProperty(c, propertyName) {
    Ignore(c.prototype, propertyName);
}
exports.ignoreProperty = ignoreProperty;
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
exports.DocumentName = DocumentName;
// for grammar reasons
// export function AsForeignKey(targetPrototypeObject:any, propertyName:string) {
//     return AsForeignKeys(targetPrototypeObject, propertyName);
// }
function Type(typeClassName) {
    return function (targetPrototypeObject, propertyName) {
        console.log("Registering a type  " + propertyName + " as " + typeClassName, " on ", targetPrototypeObject);
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
    };
}
exports.Type = Type;
function type(t, propertyName, className) {
    Type(className)(t.prototype, propertyName);
}
exports.type = type;
// plain js api
function propertyType(t, propertyName, typeClassName) {
    Type(typeClassName)(t.prototype, propertyName);
}
exports.propertyType = propertyType;
function propertyArrayType(t, propertyName, typeClassName) {
    ArrayType(typeClassName)(t.prototype, propertyName);
}
exports.propertyArrayType = propertyArrayType;
function propertyDictionaryType(t, propertyName, typeClassName) {
    DictionaryType(typeClassName)(t.prototype, propertyName);
}
exports.propertyDictionaryType = propertyDictionaryType;
/**
 * Returns the property previously defined with {@link idProperty} or the _id property.
 * @param o {Object} the object
 * @returns {any}
 * @memberof omm
 */
function getId(o) {
    var idPropertyName = PersistenceAnnotation.getIdPropertyName(PersistenceAnnotation.getClass(o));
    if (!idPropertyName)
        throw new Error("No id property defined for object of class " + PersistenceAnnotation.getClass(o));
    else
        return o[idPropertyName];
}
exports.getId = getId;
function className(fun) {
    return typeof fun == "function" ? fun['_ommClassName'] : undefined;
}
exports.className = className;
function MeteorMethod(p1, p2) {
    if (typeof p1 == "object" && typeof p2 == "string") {
        var options = {};
        options.parentObject = p1;
        options.name = p2;
        exports.meteorMethodFunctions.push(options);
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
            if (!options.name) {
                options.name = functionName;
            }
            exports.meteorMethodFunctions.push(options);
        };
    }
}
exports.MeteorMethod = MeteorMethod;
class PersistenceAnnotation {
    static getMethodOptions(functionName) {
        for (var i = 0; i < exports.meteorMethodFunctions.length; i++) {
            if (exports.meteorMethodFunctions[i].name == functionName)
                return exports.meteorMethodFunctions[i];
        }
        return undefined;
    }
    static getMethodFunctionNames(c) {
        var ret = [];
        for (var i = 0; i < exports.meteorMethodFunctions.length; i++) {
            var methodOptions = exports.meteorMethodFunctions[i];
            if (methodOptions.parentObject == c)
                ret.push(methodOptions.name);
        }
        return ret;
    }
    static getMethodFunctionNamesByObject(o) {
        var ret = [];
        for (var i = 0; i < exports.meteorMethodFunctions.length; i++) {
            var methodOptions = exports.meteorMethodFunctions[i];
            if (methodOptions.parentObject == o)
                ret.push(exports.meteorMethodFunctions[i].name);
        }
        return ret;
    }
    static getAllMethodFunctionNames() {
        var ret = [];
        for (var i = 0; i < exports.meteorMethodFunctions.length; i++) {
            ret.push(exports.meteorMethodFunctions[i].name);
        }
        return ret;
    }
    static getClass(o) {
        if (o)
            return o.constructor;
        else
            return undefined;
    }
    // ---- Entity ----
    static getEntityClassByName(className) {
        return exports.entityClasses[className];
    }
    static getCollectionClasses() {
        var result = [];
        for (var i in exports.entityClasses) {
            var entityClass = exports.entityClasses[i];
            if (PersistenceAnnotation.getCollectionName(entityClass))
                result.push(entityClass);
        }
        return result;
    }
    static getEntityClasses() {
        var result = [];
        for (var i in exports.entityClasses) {
            var entityClass = exports.entityClasses[i];
            result.push(entityClass);
        }
        return result;
    }
    static getCollectionName(f) {
        return getMetadata("persistence:collectionName", f);
    }
    static isRootEntity(f) {
        return !!PersistenceAnnotation.getCollectionName(f);
    }
    static isEntity(f) {
        return !!exports.entityClasses[className(f)];
    }
    static getDocumentPropertyName(typeClass, objectPropertyName) {
        var documentNames = getMetadata("documentNames", typeClass.prototype);
        return documentNames ? documentNames[objectPropertyName] : undefined;
    }
    static getObjectPropertyName(typeClass, documentPropertyName) {
        var objectNames = getMetadata("objectNames", typeClass.prototype);
        return objectNames ? objectNames[documentPropertyName] : undefined;
    }
    static isArrayOrMap(f, propertyName) {
        while (f != Object) {
            if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "arrayOrMap"))
                return true;
            f = PersistenceAnnotation.getParentClass(f);
        }
        return false;
    }
    // ---- typed properties ----
    static getPropertyClass(f, propertyName) {
        while (f != Object) {
            var classNameOfF = PersistenceAnnotation.getPropertyProperty(f, propertyName, "type");
            if (classNameOfF) {
                var p = PersistenceAnnotation.getEntityClassByName(classNameOfF);
                if (!p)
                    throw new Error('Class ' + f + "', property '" + propertyName + "': Defined as type '" + classNameOfF + "'. Could not find an entity with that name.");
                else
                    return p;
            }
            f = PersistenceAnnotation.getParentClass(f);
        }
        return undefined;
    }
    static getTypedPropertyNames(f) {
        var result = [];
        while (f != Object) {
            var props = getMetadata("property_properties", f);
            for (var i in props) {
                if (props[i].type)
                    result.push(i);
            }
            f = PersistenceAnnotation.getParentClass(f);
        }
        return result;
    }
    static setPropertyProperty(cls, propertyName, property, value) {
        var arr = getMetadata("property_properties", cls.constructor);
        if (!arr) {
            arr = {};
            defineMetadata("property_properties", arr, cls.constructor);
        }
        var propProps = arr[propertyName];
        if (!propProps) {
            propProps = {};
            arr[propertyName] = propProps;
        }
        propProps[property] = value;
    }
    static getPropertyNamesOfPropertiesThatHaveProperties(cls) {
        return Object.keys(getMetadata("property_properties", cls));
    }
    // this is i.e. good to find all properties on a class that have a "type" property
    static getPropertyNamesOfPropertiesThatHaveAProperty(cls, propertyPropertyName) {
        var r = [];
        var props = getMetadata("property_properties", cls);
        for (var i in props) {
            if (props[i][propertyPropertyName]) {
                r.push(i);
            }
        }
        return r;
    }
    static getPropertyProperty(cls, propertyName, propertyProperty) {
        var arr = getMetadata("property_properties", cls);
        if (arr && arr[propertyName]) {
            return arr[propertyName][propertyProperty];
        }
        return undefined;
    }
    static getParentClass(t) {
        return Object.getPrototypeOf(t.prototype).constructor;
    }
    static getIdPropertyName(t) {
        return PersistenceAnnotation.getObjectPropertyName(t, "_id") || "_id";
    }
    // ---- AsForeignKeys ----
    // static isStoredAsForeignKeys(f:TypeClass<any>, propertyName:string):boolean {
    //     while (f != Object) {
    //         if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "askeys"))
    //             return true;
    //         f = PersistenceAnnotation.getParentClass(f);
    //
    //     }
    //     return false;
    // }
    static isIgnored(f, propertyName) {
        //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
        while (f != Object) {
            if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "ignore"))
                return true;
            f = PersistenceAnnotation.getParentClass(f);
        }
        return false;
    }
    static isParent(f, propertyName) {
        //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
        while (f != Object) {
            if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "parent"))
                return true;
            f = PersistenceAnnotation.getParentClass(f);
        }
        return false;
    }
    static getParentPropertyNames(f) {
        var result = [];
        while (f != Object) {
            var props = getMetadata("parent_property", f);
            for (var i in props) {
                if (PersistenceAnnotation.isParent(f, i))
                    result.push(i);
            }
            f = PersistenceAnnotation.getParentClass(f);
        }
        return result;
    }
    // ---- Wrap ----
    static getWrappedFunctionNames(f) {
        return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
    }
    static getCollectionUpdateOptions(cls, functionName) {
        return PersistenceAnnotation.getPropertyProperty(cls.prototype, functionName, "collectionUpdate");
    }
    static getCollectionUpdateFunctionNames(f) {
        return PersistenceAnnotation.getPropertyNamesOfPropertiesThatHaveAProperty(f, 'collectionUpdate');
    }
    static getPropertyNamesByMetaData(o, metaData) {
        var result = [];
        for (var i in o) {
            var value = o[i];
            //console.log("Cave man style debugging 1",i, value,getMetadata("persistence:wrap", value) );
            if (typeof value == "function" && getMetadata(metaData, value))
                result.push(i);
        }
        return result;
    }
}
exports.PersistenceAnnotation = PersistenceAnnotation;
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
    exports.entityClasses = data.entityClasses;
    if (!data.registeredObjects)
        data.registeredObjects = {};
    exports.registeredObjects = data.registeredObjects;
    if (!data.meteorMethodFunctions)
        data.meteorMethodFunctions = [];
    exports.meteorMethodFunctions = data.meteorMethodFunctions;
    if (!data.eventListeners)
        data.eventListeners = {};
    exports.eventListeners = data.eventListeners;
})();
//# sourceMappingURL=PersistenceAnnotation.js.map