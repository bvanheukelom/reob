///<reference path="references.d.ts"/>
/**
 * Created by bert on 04.05.15.
 */

module DeSerializer{
    export class Serializer {
        objectRetriever:ObjectRetriever;

        constructor(retri:ObjectRetriever){
            this.objectRetriever = retri;
        }

        toObject<T extends Persistable>(doc:any, f:TypeClass<T>):T {
            var o:any;
            if(typeof doc=="function")
                throw new Error("Error in 'toObject'. doc is a function.");
            if (f) {
                o = Object.create(f.prototype);
                f.call(o);
            }
            else if( typeof doc=="object" ) {
                o = {};
            }
            else
                return doc;
            for (var propertyName in doc) {
                var value = doc[propertyName];
                var propertyClass = persistence.PersistenceAnnotation.getPropertyClass(f, propertyName);
                var isStoredAsKeys = persistence.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                if( propertyClass && !isStoredAsKeys )
                {
                    if (persistence.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry = value[i];
                            entry = this.toObject(entry, propertyClass);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[propertyName] = result;
                    }
                    else
                    {
                        o[propertyName] = this.toObject(value, propertyClass);
                    }
                }
                else {
                    o[propertyName] = value;
                }
            }
            return o;
        }

        toDocument(object:Persistable, rootClass?:TypeClass<Persistable>, parentObject?:Persistable, propertyNameOnParentObject?:string):Document {
            if (typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
                return <Document>object;
            else
            {
                var result:Document;
                var parentClass = persistence.PersistenceAnnotation.getClass(parentObject);
                if (parentObject && propertyNameOnParentObject && persistence.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                    return <Document><any>this.objectRetriever.getId(object);
                }
                else if (typeof object.toDocument == "function")
                    result = object.toDocument();

                else
                {
                    result = this.createDocument(object, rootClass ? rootClass : persistence.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);

                }
            }
            return result;
        }

        createDocument(object:any, rootClass?:TypeClass<Persistable>, parentObject?:Persistable, propertyNameOnParentObject?:string):Document {
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
                            result[i] = this.toDocument(subObject, rootClass, object, property);
                        }
                        doc[property] = result;
                    }

                    // object
                    else if (typeof object[property] == 'object') {
                        doc[property] = this.toDocument(value, rootClass, object, property);
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

        getClassName(o:Object):string
        {
            if( typeof o =="object" && persistence.PersistenceAnnotation.getClass( o ))
            {
                return persistence.className( persistence.PersistenceAnnotation.getClass( o ) );
            }
            else
                return typeof o;
        }

    }
}