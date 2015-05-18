///<reference path="references.d.ts"/>
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
                var propertyClass = persistence.PersistenceAnnotation.getPropertyClass(f, propertyName);
                var isStoredAsKeys = persistence.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                if (propertyClass && !isStoredAsKeys) {
                    if (persistence.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
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
            if (typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
                return object;
            else {
                var result;
                var parentClass = persistence.PersistenceAnnotation.getClass(parentObject);
                if (parentObject && propertyNameOnParentObject && persistence.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                    return this.objectRetriever.getId(object);
                }
                else if (typeof object.toDocument == "function")
                    result = object.toDocument();
                else {
                    result = this.createDocument(object, rootClass ? rootClass : persistence.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                }
            }
            return result;
        };
        Serializer.prototype.createDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
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
            if (typeof o == "object" && persistence.PersistenceAnnotation.getClass(o)) {
                return persistence.className(persistence.PersistenceAnnotation.getClass(o));
            }
            else
                return typeof o;
        };
        return Serializer;
    })();
    DeSerializer.Serializer = Serializer;
})(DeSerializer || (DeSerializer = {}));
//# sourceMappingURL=Serializer.js.map