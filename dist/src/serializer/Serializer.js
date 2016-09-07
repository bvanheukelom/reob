"use strict";
var Cloner = require("./Cloner");
var omm = require("../omm");
var SubObjectPath_1 = require("./SubObjectPath");
var PersistenceAnnotation_1 = require("../annotations/PersistenceAnnotation");
var Serializer = (function () {
    function Serializer() {
    }
    Serializer.forEachTypedObject = function (object, cb) {
        this.forEachTypedObjectRecursive(object, object, new SubObjectPath_1.default(), [], cb);
    };
    Serializer.forEachTypedObjectRecursive = function (rootObject, object, path, visited, cb) {
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
        });
    };
    Serializer.prototype.toObject = function (doc, handler, f, serializationPath) {
        var o;
        if (Array.isArray(doc)) {
            var r = [];
            for (var j = 0; j < doc.length; j++) {
                r[j] = this.toObject(doc[j], handler, f);
            }
            o = r;
        }
        else if (!doc || typeof doc == "string" || typeof doc == "number" || typeof doc == "date" || typeof doc == "boolean")
            o = doc;
        else
            o = this.toObjectRecursive(doc, undefined, f, handler);
        if (handler && serializationPath) {
            omm.SerializationPath.setObjectContext(o, serializationPath, handler);
            omm.SerializationPath.updateObjectContexts(o, handler);
        }
        return o;
    };
    Serializer.prototype.toObjectRecursive = function (doc, parent, f, handler) {
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
            if (doc._className) {
                f = PersistenceAnnotation_1.PersistenceAnnotation.getEntityClassByName(doc._className);
            }
            if (!f)
                return Cloner.clone(doc);
            //     throw new Error("Could not determine class of document. Either the document needs to have a '_className' property or a class needs to be passed to the serializer. Document: "+ JSON.stringify( doc ) );
            // instantiate the new object
            if (f && f.prototype)
                o = Object.create(f.prototype);
            else
                o = {};
            if (doc._serializationPath) {
                var sp = new omm.SerializationPath(doc._serializationPath);
                omm.SerializationPath.setObjectContext(o, sp, handler);
            }
            PersistenceAnnotation_1.PersistenceAnnotation.getParentPropertyNames(f).forEach(function (parentPropertyName) {
                o[parentPropertyName] = parent;
            });
            // iterate over all properties
            for (var propertyName in doc) {
                if (propertyName == "_className" || propertyName == "_serializationPath")
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty = f ? PersistenceAnnotation_1.PersistenceAnnotation.getObjectPropertyName(f, propertyName) : undefined;
                if (!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = PersistenceAnnotation_1.PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);
                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (PersistenceAnnotation_1.PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry = value[i];
                            entry = this.toObjectRecursive(entry, o, propertyClass, handler);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[objectNameOfTheProperty] = result;
                    }
                    else {
                        o[objectNameOfTheProperty] = this.toObjectRecursive(value, o, propertyClass, handler);
                    }
                }
                else {
                    o[objectNameOfTheProperty] = Cloner.clone(value);
                }
            }
        }
        // setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
        //o._objectRetriever = this.objectRetriever;
        return o;
    };
    Serializer.prototype.toDocument = function (object, includeContext, omitPropertiesPrivateToServer) {
        return this.toDocumentRecursive(object, includeContext, omitPropertiesPrivateToServer);
    };
    Serializer.prototype.toDocumentRecursive = function (object, includeContext, omitPropertiesPrivateToServer, rootClass, parentObject, propertyNameOnParentObject) {
        var result;
        if (!object || typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
            result = object;
        else if (Array.isArray(object)) {
            result = [];
            for (var i = 0; i < object.length; i++) {
                result[i] = this.toDocumentRecursive(object[i], includeContext);
            }
        }
        else {
            var objectClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(object);
            if (typeof objectClass.toDocument == "function") {
                result = objectClass.toDocument(object);
            }
            else {
                var parentClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(parentObject);
                {
                    result = this.createDocument(object, includeContext, omitPropertiesPrivateToServer, rootClass ? rootClass : PersistenceAnnotation_1.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                }
            }
        }
        //console.log("returning document:",result);
        return result;
    };
    Serializer.prototype.createDocument = function (object, includeContext, omitPropertiesPrivateToServer, rootClass, parentObject, propertyNameOnParentObject) {
        var doc = {};
        var context = omm.SerializationPath.getObjectContext(object);
        if (includeContext) {
            if (context && context.serializationPath)
                doc['_serializationPath'] = context.serializationPath.toString();
            var cls = omm.PersistenceAnnotation.getClass(object);
            if (cls && omm.PersistenceAnnotation.isEntity(cls)) {
                doc['_className'] = omm.className(cls);
            }
        }
        var objectClass = PersistenceAnnotation_1.PersistenceAnnotation.getClass(object);
        for (var property in object) {
            var value = object[property];
            var documentNameOfTheProperty = PersistenceAnnotation_1.PersistenceAnnotation.getDocumentPropertyName(objectClass, property);
            if (!documentNameOfTheProperty)
                documentNameOfTheProperty = property;
            var needsToBeOmittedBecauseItsPrivate = omitPropertiesPrivateToServer && PersistenceAnnotation_1.PersistenceAnnotation.isPrivateToServer(objectClass, property);
            if (needsToBeOmittedBecauseItsPrivate) {
                console.log("Omitting ", property);
            }
            if (value !== undefined && !PersistenceAnnotation_1.PersistenceAnnotation.isIgnored(objectClass, property) && !PersistenceAnnotation_1.PersistenceAnnotation.isParent(objectClass, property) && !needsToBeOmittedBecauseItsPrivate) {
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
                            result[i] = this.toDocumentRecursive(subObject, includeContext, omitPropertiesPrivateToServer, rootClass, object, property);
                        }
                        doc[documentNameOfTheProperty] = result;
                    }
                    else if (typeof object[property] == 'object') {
                        doc[documentNameOfTheProperty] = this.toDocumentRecursive(value, includeContext, omitPropertiesPrivateToServer, rootClass, object, property);
                    }
                    else {
                        throw new Error("Unsupported type : " + typeof value);
                    }
                }
                else if (typeof value == 'function') {
                }
                else {
                    doc[documentNameOfTheProperty] = Cloner.clone(value);
                }
            }
        }
        return doc;
    };
    return Serializer;
}());
exports.Serializer = Serializer;
//# sourceMappingURL=Serializer.js.map