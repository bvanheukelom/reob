
import * as Cloner from "./Cloner"
import Document from "./Document"
import * as omm from "../omm"
import SubObjectPath from "./SubObjectPath"
import {TypeClass, PersistenceAnnotation, getId, setNonEnumerableProperty, className } from "../annotations/PersistenceAnnotation"

export class Serializer {

    constructor(){
    }

    static forEachTypedObject(object:Object, cb:(path:SubObjectPath, object:Object)=>void ){
        this.forEachTypedObjectRecursive(object,object, new SubObjectPath(), [], cb);

    }

    static  forEachTypedObjectRecursive(rootObject:Object, object:Object, path:SubObjectPath, visited:Array<Object>,cb:(path:SubObjectPath, object:Object)=>void):void {
        var that = this;
        if (visited.indexOf(object) != -1)
            return;
        if (!object || typeof object != "object")
            return;
        visited.push(object);

        cb(path, object);
        var objectClass = PersistenceAnnotation.getClass(object);
        PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
            if( !PersistenceAnnotation.isParent(objectClass, typedPropertyName) ) {
                //console.log("updating foreignkey property " + typedPropertyName);
                var v:Object = object[typedPropertyName];
                if (v) {
                    if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                        //console.log("updating foreignkey property " + typedPropertyName + " is array");
                        for (var i in v) {
                            var e = v[i];
                            //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                            var subObjectPath = path.clone();
                            if (typeof getId(e)!="undefined") {
                                subObjectPath.appendArrayOrMapLookup(typedPropertyName, getId(e));
                            } else {
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
    }

    toObject(doc:Document, handler?:any, f?:TypeClass<any>, serializationPath?:omm.SerializationPath ):any {
        var o:any;
        if(Array.isArray(doc)){
            var r = [];
            for( var j=0; j<(<Array<any>>doc).length; j++ ){
                r[j] = this.toObject(doc[j], handler, f );
            }
            o = <any>r;
        } else if ( !doc || typeof doc == "string" || typeof doc == "number"  || typeof doc == "date" || typeof doc == "boolean")
            o =  doc;
        else
            o =  this.toObjectRecursive(doc, undefined, f, handler);

        if( handler && serializationPath ) {
            omm.SerializationPath.setObjectContext(o, serializationPath, handler);
            omm.SerializationPath.updateObjectContexts(o, handler);
        }

        return o;
    }

    private toObjectRecursive<T extends Object>(doc:Document, parent:Object, f?:TypeClass<T>, handler?:any):T {
        var o:T;
        if( !doc )
            return <T>doc;
        if(typeof doc=="function")
            throw new Error("Error in 'toObject'. doc is a function.");



        if ( f && typeof f["toObject"]=="function" ) {
                //console.log("using the custom toObject function of class "+omm.className(f));
                o = f["toObject"](doc);
        } else {
            // if the document contains a property called "className" it defines the class that's going to be instantiated
            if (doc._className){
                f = PersistenceAnnotation.getEntityClassByName(doc._className);
            }
            if(!f)
                return Cloner.clone(doc);

            //     throw new Error("Could not determine class of document. Either the document needs to have a '_className' property or a class needs to be passed to the serializer. Document: "+ JSON.stringify( doc ) );

            // instantiate the new object
            if( f && f.prototype )
                o = Object.create(f.prototype);
            else
                o = <any>{};

            if( doc._serializationPath ){
                var sp = new omm.SerializationPath(doc._serializationPath);
                omm.SerializationPath.setObjectContext(o, sp, handler);
            }

            PersistenceAnnotation.getParentPropertyNames(f).forEach(function (parentPropertyName:string) {
                o[parentPropertyName] = parent;
            });

            // iterate over all properties
            for (var propertyName in doc) {
                if( propertyName=="_className" || propertyName=="_serializationPath" )
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty:string = f ? PersistenceAnnotation.getObjectPropertyName(f, propertyName) : undefined;
                if(!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);

                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry:Document = value[i];
                            entry = this.toObjectRecursive(entry, o, propertyClass, handler);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[objectNameOfTheProperty] = result;
                    }
                    else {
                        o[objectNameOfTheProperty] = this.toObjectRecursive(value, o, propertyClass, handler );
                    }
                }
                else {
                    o[objectNameOfTheProperty] = Cloner.clone(value);
                    // o[objectNameOfTheProperty] = value;
                }
            }

        }
        // setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
        //o._objectRetriever = this.objectRetriever;
        return o;
    }

    toDocument( object:Object, includeContext?:boolean ):Document {
        return this.toDocumentRecursive(object, includeContext);
    }

    private toDocumentRecursive(object:any, includeContext?:boolean, rootClass?:TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var result:Document;
        if ( !object || typeof object == "string" || typeof object == "number"  || typeof object == "date" || typeof object == "boolean")
            result =  <Document>object;
        else if( Array.isArray(object) ){
            result = [];
            for( var i=0; i<object.length; i++ ){
                result[i] = this.toDocumentRecursive(object[i], includeContext);
            }
        } else {
            var objectClass =  PersistenceAnnotation.getClass(object);
            if( typeof (<any>objectClass).toDocument == "function" ){
                result = (<any>objectClass).toDocument( object );
            } else {
                var parentClass = PersistenceAnnotation.getClass(parentObject);
                {
                    result = this.createDocument(object, includeContext, rootClass ? rootClass : PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);
                }
            }
        }
        //console.log("returning document:",result);
        return result;
    }

    private createDocument(object:any, includeContext?:boolean, rootClass?:TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var doc:any = {};
        var context = omm.SerializationPath.getObjectContext(object);
        if( includeContext ) {
            if (context && context.serializationPath)
                doc['_serializationPath'] = context.serializationPath.toString();
            var cls = omm.PersistenceAnnotation.getClass(object);
            if (cls && omm.PersistenceAnnotation.isEntity(cls)) {
                doc['_className'] = omm.className(cls);
            }
        }
        var objectClass = PersistenceAnnotation.getClass(object);
        for (var property in object) {
            var value = object[property];
            var documentNameOfTheProperty:string = PersistenceAnnotation.getDocumentPropertyName(objectClass,property);
            if( !documentNameOfTheProperty )
                documentNameOfTheProperty = property;
            if (value !== undefined && !PersistenceAnnotation.isIgnored(objectClass, property)&& !PersistenceAnnotation.isParent(objectClass, property)) {
                // primitives
                if( PersistenceAnnotation.getPropertyClass(objectClass,property) ) {

                    // array
                    if (PersistenceAnnotation.isArrayOrMap(objectClass, property)) {
                        var result;
                        if (Array.isArray(value))
                            result = [];
                        else
                            result = {};

                        for (var i in value) {
                            var subObject = value[i];
                            result[i] = this.toDocumentRecursive(subObject, includeContext, rootClass, object, property);
                        }
                        doc[documentNameOfTheProperty] = result;
                    }
                    // object
                    else if (typeof object[property] == 'object') {
                        doc[documentNameOfTheProperty] = this.toDocumentRecursive(value, includeContext, rootClass, object, property);
                    } else {
                        throw new Error("Unsupported type : "+ typeof value);
                    }
                }
                else if (typeof value == 'function') {
                    // not doing eeeeenithing with functions
                }
                else {
                    doc[documentNameOfTheProperty] = Cloner.clone(value);
                }

            }

        }
        return <Document>doc;
    }
}