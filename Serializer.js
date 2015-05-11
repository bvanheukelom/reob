///<reference path="references.d.ts"/>
/**
 * Created by bert on 04.05.15.
 */
var DeSerializer;
(function (DeSerializer) {
    var Serializer = (function () {
        function Serializer() {
        }
        Serializer.toObject = function (doc, f) {
            var o;
            if (f) {
                o = Object.create(f.prototype);
                f.call(o);
            }
            else {
                o = {};
            }
            for (var propertyName in doc) {
                var value = doc[propertyName];
                if (persistence.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                    var result = Array.isArray(value) ? [] : {};
                    var entryClass = persistence.PersistenceAnnotation.getPropertyClass(f, propertyName);
                    var arr = value;
                    for (var i in value) {
                        var entry = value[i];
                        if (entryClass && !persistence.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName))
                            entry = Serializer.toObject(entry, entryClass);
                        result[i] = entry;
                    }
                    o[propertyName] = result;
                }
                else if (typeof value == 'object') {
                    var propertyClass = persistence.PersistenceAnnotation.getPropertyClass(f, propertyName);
                    if (propertyClass)
                        o[propertyName] = DeSerializer.Serializer.toObject(value, propertyClass);
                    else
                        o[propertyName] = value;
                }
                else {
                    o[propertyName] = value;
                }
            }
            return o;
        };
        Serializer.toDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var result;
            var parentClass = persistence.PersistenceAnnotation.getClass(parentObject);
            if (parentObject && propertyNameOnParentObject && persistence.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                if (object.persistencePath)
                    return object.persistencePath.toString();
                else {
                    var objectClass = persistence.PersistenceAnnotation.getClass(object);
                    if (persistence.PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                        return new persistence.PersistencePath(persistence.PersistenceAnnotation.className(objectClass), object.getId()).toString();
                    }
                    else {
                        throw new Error("Can not serialize '" + propertyNameOnParentObject + "' on class " + persistence.PersistenceAnnotation.className(parentClass) + ". Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id. Value of '" + propertyNameOnParentObject + "':" + object);
                    }
                }
            }
            else if (typeof object.toDocument == "function")
                result = object.toDocument();
            else
                result = Serializer.createDocument(object, rootClass ? rootClass : persistence.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
            return result;
        };
        Serializer.createDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
            var doc = {};
            var objectClass = persistence.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (property == "id") {
                    doc._id = object.id;
                }
                else if (object[property] !== undefined && property != "persistencePath") {
                    if (typeof value == "string" || typeof value == "number" || typeof value == "date" || typeof value == "boolean")
                        doc[property] = value;
                    else if (persistence.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                        var result;
                        if (Array.isArray(object[property]))
                            result = [];
                        else
                            result = {};
                        for (var i in value) {
                            var subObject = value[i];
                            result[i] = Serializer.toDocument(subObject, rootClass, object, property);
                        }
                        doc[property] = result;
                    }
                    else if (typeof object[property] == 'object') {
                        doc[property] = Serializer.toDocument(value, rootClass, object, property);
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
        return Serializer;
    })();
    DeSerializer.Serializer = Serializer;
})(DeSerializer || (DeSerializer = {}));
//# sourceMappingURL=Serializer.js.map