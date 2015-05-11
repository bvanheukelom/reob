///<reference path="references.d.ts"/>
/**
 * Created by bert on 04.05.15.
 */

module DeSerializer{
    export class Serializer {
        static toObject<T extends Persistable>(doc:any, f:TypeClass<T>):T {
            var o:any;
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

                    var arr:Array<any> = <Array<any>>value;
                    for (var i in value) {
                        var entry = value[i];
                        if (entryClass && !persistence.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName))
                            entry = Serializer.toObject(entry, entryClass);
                        result[i] = entry;
                    }
                    // this can only happen once because if the property is accessed the "lazy load" already kicks in
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
        }

        static toDocument(object:Persistable, rootClass?:TypeClass<Persistable>, parentObject?:Persistable, propertyNameOnParentObject?:string):Document {
            var result:Document;
            var parentClass = persistence.PersistenceAnnotation.getClass(parentObject);
            if (parentObject && propertyNameOnParentObject && persistence.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                if (object.persistencePath)
                    return <Document><any>object.persistencePath.toString();
                else {
                    var objectClass = persistence.PersistenceAnnotation.getClass(object);
                    if (persistence.PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                        return <Document><any>new persistence.PersistencePath(persistence.PersistenceAnnotation.className(objectClass), object.getId()).toString();
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
        }

        static createDocument(object:any, rootClass?:TypeClass<Persistable>, parentObject?:Persistable, propertyNameOnParentObject?:string):Document {
            var doc:any = {};
            var objectClass = persistence.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (property == "id") {
                    doc._id = object.id;
                }
                else if (object[property] !== undefined && property != "persistencePath") {
                    // primitives

                    if (typeof value == "string" || typeof value == "number" || typeof value == "date" || typeof value == "boolean")
                        doc[property] = value;

                    // array
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

                    // object
                    else if (typeof object[property] == 'object') {
                        doc[property] = Serializer.toDocument(value, rootClass, object, property);
                    }

                    else if (typeof value == 'function') {
                        // not doing eeeeenithing with functions
                    }
                    else {
                        console.error("Unsupported type : ", typeof value);
                    }
                }
            }
            return <Document>doc;
        }

    }
}