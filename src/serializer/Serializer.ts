
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

    toObject<T extends Object>(doc:Document, f?:TypeClass<T>, handler?:any):T {
        var o:T;
        if(Array.isArray(doc)){
            var r = [];
            for( var j=0; j<(<Array<any>>doc).length; j++ ){
                r[j] = this.toObjectRecursive(doc[j], undefined, f);
            }
            o = <any>r;
        } else if ( !doc || typeof doc == "string" || typeof doc == "number"  || typeof doc == "date" || typeof doc == "boolean")
            o =  <T>doc;
        else
            o =  this.toObjectRecursive(doc,undefined, f);

        omm.SerializationPath.updateObjectContexts( o, handler );
        
        return o;
    }

    private toObjectRecursive<T extends Object>(doc:Document, parent:Object, f?:TypeClass<T>):T {
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
            if (doc.className){
                f = PersistenceAnnotation.getEntityClassByName(doc.className);
            }
            if(!f)
                throw new Error("Could not determine class of document. Either the document needs to have a 'className' property or a class needs to be passed to the serializer. Document: "+ JSON.stringify( doc ) );
            // instantiate the new object
            o = Object.create(f.prototype);

            PersistenceAnnotation.getParentPropertyNames(f).forEach(function (parentPropertyName:string) {
                o[parentPropertyName] = parent;
            });

            // iterate over all properties
            for (var propertyName in doc) {
                if( propertyName=="className" )
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty:string = PersistenceAnnotation.getObjectPropertyName(f, propertyName);
                if(!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);

                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry:Document = value[i];
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

        }
        // setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
        //o._objectRetriever = this.objectRetriever;
        return o;
    }

    toDocument(object:Object ):Document {
        return this.toDocumentRecursive(object);
    }

    private toDocumentRecursive(object:any, rootClass?:TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var result:Document;
        if ( !object || typeof object == "string" || typeof object == "number"  || typeof object == "date" || typeof object == "boolean")
            result =  <Document>object;
        else if( Array.isArray(object) ){
            result = [];
            for( var i=0; i<object.length; i++ ){
                result[i] = this.toDocumentRecursive(object[i]);
            }
        } else {
            var objectClass =  PersistenceAnnotation.getClass(object);
            if( typeof (<any>objectClass).toDocument == "function" ){
                result = (<any>objectClass).toDocument( object );
            } else {
                var parentClass = PersistenceAnnotation.getClass(parentObject);
                // if (parentObject && propertyNameOnParentObject && PersistenceAnnotation.isStoredAsForeignKeys(parentClass, propertyNameOnParentObject)) {
                //     return <Document><any>this.objectRetriever.getId(object);
                // }
                // else
                {
                    result = this.createDocument(object, rootClass ? rootClass : PersistenceAnnotation.getClass(object), parentObject, propertyNameOnParentObject);

                    // if the class of the object does not correspond to the expected type, we add it to the document
                    if( parentClass && objectClass!=PersistenceAnnotation.getPropertyClass(parentClass, propertyNameOnParentObject))
                        result.className = className(objectClass);
                }
            }
        }
        //console.log("returning document:",result);
        return result;
    }

    private createDocument(object:any, rootClass?:TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var doc:any = {};
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
                            result[i] = this.toDocumentRecursive(subObject, rootClass, object, property);
                        }
                        doc[documentNameOfTheProperty] = result;
                    }
                    // object
                    else if (typeof object[property] == 'object') {
                        doc[documentNameOfTheProperty] = this.toDocumentRecursive(value, rootClass, object, property);
                    } else {
                        throw new Error("Unsupported type : "+ typeof value);
                    }
                }
                else if (typeof value == 'function') {
                    // not doing eeeeenithing with functions
                }
                else {
                    doc[documentNameOfTheProperty] = value;
                }

            }

        }
        return <Document>doc;
    }
}