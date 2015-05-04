/**
 * Created by bert on 04.05.15.
 */
var PersistenceAnnotation = require("./PersistenceAnnotation");
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
            if (value instanceof Array) {
                var arr = value;
                o[propertyName] = [];
                var entryClass = PersistenceAnnotation.getPropertyClass(f, propertyName);
                for (var i = 0; i < arr.length; i++) {
                    var arrayEntry = Serializer.toObject(arr[i], entryClass);
                }
            }
            else if (typeof value == 'object') {
                var propertyClass = PersistenceAnnotation.getPropertyClass(f, propertyName);
                o[propertyName] = Serializer.toObject(value, entryClass);
            }
            else {
                o[propertyName] = value;
            }
        }
        return o;
    };
    Serializer.toDocument = function (object, depth) {
        debugger;
        var result;
        if (PersistenceAnnotation.getCollectionName(object.constructor) && depth)
            return object.getId();
        else if (typeof object.toDocument == "function")
            result = object.toDocument();
        else
            result = Serializer.createDocument(object, depth);
        return result;
    };
    Serializer.createDocument = function (object, depth) {
        if (!depth)
            depth = 0;
        var doc = {};
        for (var property in object) {
            //if (excludedProperties && excludedProperties.indexOf(property)!=-1 )
            //{
            //    //console.log("Skipping excluded property : " + property);
            //    continue;
            //}
            if (object[property] !== undefined && property != "persistencePath") {
                // primitives
                if (typeof object[property] == "string" || typeof object[property] == "number" || typeof object[property] == "date" || typeof object[property] == "boolean")
                    doc[property] = object[property];
                else if (object[property] instanceof Array) {
                    doc[property] = [];
                    var arr = object[property];
                    for (var i = 0; i < arr.length; i++) {
                        var subObject = arr[i];
                        doc[property].push(Serializer.toDocument(subObject, depth + 1));
                    }
                }
                else if (typeof object[property] == 'object') {
                    doc[property] = Serializer.toDocument(object[property], depth + 1);
                }
                else if (typeof object[property] == 'function') {
                }
                else {
                    console.error("Unsupported type : ", typeof object[property]);
                }
            }
        }
        return doc;
    };
    return Serializer;
})();
module.exports = Serializer;
//# sourceMappingURL=Serializer.js.map