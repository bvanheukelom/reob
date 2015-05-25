///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/PersistencePath.ts"/>
///<reference path="../annotations/Document.ts"/>
///<reference path="../annotations/TypeClass.ts"/>

module omm{
    export class Serializer {
        objectRetriever:ObjectRetriever;

        constructor(retri:ObjectRetriever){
            this.objectRetriever = retri;
        }

        toObject<T extends omm.Persistable>(doc:Document, f:omm.TypeClass<T>):T {
            var o:any;
            if(typeof doc=="function")
                throw new Error("Error in 'toObject'. doc is a function.");

            if (f) {
                if( typeof f.toObject=="function" ) {
                    //console.log("using the custom toObject function of class "+omm.className(f));
                    return f.toObject(doc);
                } else{
                    if(doc.className)
                        f = omm.PersistenceAnnotation.getEntityClassByName(doc.className);
                    o = Object.create(f.prototype);
                    f.call(o);
                }
            }
            else if( typeof doc=="object" ) {
                o = {};
            }
            else{
                // todo this should probably throw an error
                return <T>doc;
            }
            for (var propertyName in doc) {
                var value = doc[propertyName];
                var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, propertyName);
                var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                if( propertyClass && !isStoredAsKeys )
                {
                    if (omm.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
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

        toDocument(object:omm.Persistable, rootClass?:omm.TypeClass<omm.Persistable>, parentObject?:omm.Persistable, propertyNameOnParentObject?:string):omm.Document {
            var result:omm.Document;
            if (typeof object == "string" || typeof object == "number" || typeof object == "date" || typeof object == "boolean")
                result =  <Document>object;
            else
            {
                var objectClass =  omm.PersistenceAnnotation.getClass(object);
                if( typeof (<any>objectClass).toDocument == "function" ){
                    result = (<any>objectClass).toDocument( object );
                } else {
                    var parentClass = omm.PersistenceAnnotation.getClass(parentObject);
                    if (parentObject && propertyNameOnParentObject && omm.PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                        return <omm.Document><any>this.objectRetriever.getId(object);
                    }
                    else {
                        result = this.createDocument(object, rootClass ? rootClass : omm.PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);

                        // if the class of the object does not correspond to the expected type, we add it to the document
                        if( parentClass && objectClass!=omm.PersistenceAnnotation.getPropertyClass(parentClass, propertyNameOnParentObject))
                            result.className = omm.className(objectClass);
                    }
                }
            }
            return result;
        }

        createDocument(object:any, rootClass?:omm.TypeClass<omm.Persistable>, parentObject?:omm.Persistable, propertyNameOnParentObject?:string):Document {
            var doc:any = {};
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (value !== undefined && property != "persistencePath") {
                    // primitives
                    if( omm.PersistenceAnnotation.getPropertyClass(objectClass,property) ) {

                        // array
                        if (omm.PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                            var result;
                            if (Array.isArray(value))
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
                        } else {
                            throw new Error("Unsupported type : "+ typeof value);
                        }
                    }
                    else if (typeof value == 'function') {
                        // not doing eeeeenithing with functions
                    }
                    else {
                        doc[property] = value;
                    }

                }

            }
            return <Document>doc;
        }

        getClassName(o:Object):string
        {
            if( typeof o =="object" && omm.PersistenceAnnotation.getClass( o ))
            {
                return omm.className( omm.PersistenceAnnotation.getClass( o ) );
            }
            else
                return typeof o;
        }

    }
}