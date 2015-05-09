/**
 * Created by bert on 04.05.15.
 */
Serializer = (function () {
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
            if (value instanceof Array) {
                var arr = value;
                o[propertyName] = [];
                var entryClass = PersistenceAnnotation.getPropertyClass(f, propertyName);
                for (var i = 0; i < arr.length; i++) {
                    var arrayEntry = arr[i];
                    if (entryClass)
                        arrayEntry = Serializer.toObject(arr[i], entryClass);
                    o[propertyName][i] = arrayEntry;
                }
            }
            else if (typeof value == 'object') {
                var propertyClass = PersistenceAnnotation.getPropertyClass(f, propertyName);
                if (propertyClass)
                    o[propertyName] = Serializer.toObject(value, propertyClass);
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
        var parentClass = PersistenceAnnotation.getClass(parentObject);
        if (parentObject && propertyNameOnParentObject && PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
            if (object.persistencePath)
                return object.persistencePath.toString();
            else {
                var objectClass = PersistenceAnnotation.getClass(object);
                if (PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                    return new PersistencePath(PersistenceAnnotation.className(objectClass), object.getId()).toString();
                }
                else {
                    throw new Error("Can not serialize '" + propertyNameOnParentObject + "' on class " + PersistenceAnnotation.className(parentClass) + ". Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id. Value of '" + propertyNameOnParentObject + "':" + object);
                }
            }
            return object.getId();
        }
        else if (typeof object.toDocument == "function")
            result = object.toDocument();
        else
            result = Serializer.createDocument(object, rootClass ? rootClass : PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
        return result;
    };
    Serializer.createDocument = function (object, rootClass, parentObject, propertyNameOnParentObject) {
        var doc = {};
        for (var property in object) {
            var value = object[property];
            if (property == "id") {
                doc._id = object.id;
            }
            else if (object[property] !== undefined && property != "persistencePath") {
                // primitives
                if (typeof value == "string" || typeof value == "number" || typeof value == "date" || typeof value == "boolean")
                    doc[property] = value;
                else if (value instanceof Array) {
                    doc[property] = [];
                    var arr = value;
                    for (var i = 0; i < arr.length; i++) {
                        var subObject = arr[i];
                        doc[property].push(Serializer.toDocument(subObject, rootClass, object, property));
                    }
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
