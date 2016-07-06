"use strict";
const SubObjectPath_1 = require("./SubObjectPath");
const PersistenceAnnotation_1 = require("../annotations/PersistenceAnnotation");
class Serializer {
    constructor() {
    }
    static forEachTypedObject(object, cb) {
        this.forEachTypedObjectRecursive(object, object, new SubObjectPath_1.default(), [], cb);
    }
    static forEachTypedObjectRecursive(rootObject, object, path, visited, cb) {
        var that = this;
        if (visited.indexOf(object) != -1)
            return;
        if (!object || typeof object != "object")
            return;
        visited.push(object);
        cb(path, object);
        var objectClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(object);
        PersistenceAnnotation_1.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
            if (!PersistenceAnnotation_1.PersistenceAnnotation.isParent(objectClass, typedPropertyName)) {
                //console.log("updating foreignkey property " + typedPropertyName);
                var v = object[typedPropertyName];
                if (v) {
                    if (PersistenceAnnotation_1.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                        //console.log("updating foreignkey property " + typedPropertyName + " is array");
                        for (var i in v) {
                            var e = v[i];
                            //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                            var subObjectPath = path.clone();
                            if (typeof PersistenceAnnotation_1.getId(e) != "undefined") {
                                subObjectPath.appendArrayOrMapLookup(typedPropertyName, PersistenceAnnotation_1.getId(e));
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
            //else {
            //    //console.log( "foreign key "+typedPropertyName );
            //    if (!Serializer.needsLazyLoading(object, typedPropertyName)) {
            //        var v:MeteorPersistable = object[typedPropertyName];
            //        if (v) {
            //            if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
            //                for (var i in v) {
            //                    var e = v[i];
            //                    var subObjectPath = path.clone();
            //                    if (e.getId && e.getId()) {
            //                        subObjectPath.appendArrayOrMapLookup(typedPropertyName, e.getId());
            //                    } else {
            //                        subObjectPath.appendArrayOrMapLookup(typedPropertyName, i);
            //                    }
            //                    cb(subObjectPath, v);
            //                }
            //            }
            //            else if (!v._serializationPath)
            //                that.updateSerializationPaths(v, visited);
            //        }
            //    }else{
            //
            //    }
            //}
        });
    }
    toObject(doc, f) {
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
        return o;
    }
    toObjectRecursive(doc, parent, f) {
        var o;
        if (!doc)
            return doc;
        if (typeof doc == "function")
            throw new Error("Error in 'toObject'. doc is a function.");
        if (f && typeof f["toObject"] == "function") {
            //console.log("using the custom toObject function of class "+omm.className(f));
            o = f["toObject"](doc);
        }
        else {
            // if the document contains a property called "className" it defines the class that's going to be instantiated
            if (doc.className) {
                f = PersistenceAnnotation_1.PersistenceAnnotation.getEntityClassByName(doc.className);
            }
            if (!f)
                throw new Error("Could not determine class of document. Either the document needs to have a 'className' property or a class needs to be passed to the serializer. Document: " + JSON.stringify(doc));
            // instantiate the new object
            o = new f();
            // iterate over all properties
            for (var propertyName in doc) {
                if (propertyName == "className")
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty = PersistenceAnnotation_1.PersistenceAnnotation.getObjectPropertyName(f, propertyName);
                if (!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = PersistenceAnnotation_1.PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);
                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (PersistenceAnnotation_1.PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry = value[i];
                            entry = this.toObjectRecursive(entry, o, propertyClass);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
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
            PersistenceAnnotation_1.PersistenceAnnotation.getParentPropertyNames(f).forEach(function (parentPropertyName) {
                o[parentPropertyName] = parent;
            });
        }
        // setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
        //o._objectRetriever = this.objectRetriever;
        return o;
    }
    toDocument(object) {
        return this.toDocumentRecursive(object);
    }
    toDocumentRecursive(object, rootClass, parentObject, propertyNameOnParentObject) {
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
            var objectClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(object);
            if (typeof objectClass.toDocument == "function") {
                result = objectClass.toDocument(object);
            }
            else {
                var parentClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(parentObject);
                // if (parentObject && propertyNameOnParentObject && PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                //     return <Document><any>this.objectRetriever.getId(object);
                // }
                // else
                {
                    result = this.createDocument(object, rootClass ? rootClass : PersistenceAnnotation_1.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                    // if the class of the object does not correspond to the expected type, we add it to the document
                    if (parentClass && objectClass != PersistenceAnnotation_1.PersistenceAnnotation.getPropertyClass(parentClass, propertyNameOnParentObject))
                        result.className = PersistenceAnnotation_1.className(objectClass);
                }
            }
        }
        //console.log("returning document:",result);
        return result;
    }
    createDocument(object, rootClass, parentObject, propertyNameOnParentObject) {
        var doc = {};
        var objectClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(object);
        for (var property in object) {
            var value = object[property];
            var documentNameOfTheProperty = PersistenceAnnotation_1.PersistenceAnnotation.getDocumentPropertyName(objectClass, property);
            if (!documentNameOfTheProperty)
                documentNameOfTheProperty = property;
            if (value !== undefined && !PersistenceAnnotation_1.PersistenceAnnotation.isIgnored(objectClass, property) && !PersistenceAnnotation_1.PersistenceAnnotation.isParent(objectClass, property)) {
                // primitives
                if (PersistenceAnnotation_1.PersistenceAnnotation.getPropertyClass(objectClass, property)) {
                    // array
                    if (PersistenceAnnotation_1.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
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
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Serializer;
//# sourceMappingURL=Serializer.js.map