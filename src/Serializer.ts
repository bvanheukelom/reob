
import * as Cloner from "./Cloner"
import { Document } from "./Document"
import * as reob from "./reob"
import { SubObjectPath } from "./SubObjectPath"
import { Reflect, getId } from "./Annotations"

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
        var objectClass = Reflect.getClass(object);
        Reflect.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
            if( !Reflect.isParent(objectClass, typedPropertyName) ) {
                //console.log("updating foreignkey property " + typedPropertyName);
                var v:Object = object[typedPropertyName];
                if (v) {
                    if (Reflect.isArrayOrMap(objectClass, typedPropertyName)) {
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

    toObject(doc:Document, handler?:any, f?:reob.TypeClass<any>, serializationPath?:reob.SerializationPath, request?:reob.Request ):any {
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
            o =  this.toObjectRecursive(doc, undefined, f, handler, request);

        if( handler && serializationPath ) {
            reob.SerializationPath.setObjectContext(o, serializationPath, handler, request);
            reob.SerializationPath.updateObjectContexts(o, handler, request);
        }

        return o;
    }

    private toObjectRecursive<T extends Object>(doc:Document, parent:Object, f:reob.TypeClass<T>, handler:reob.Handler, request:reob.Request):T {
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
                f = Reflect.getEntityClassByName(doc._className);
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
                var sp = new reob.SerializationPath(doc._serializationPath);
                reob.SerializationPath.setObjectContext(o, sp, handler, request);
            }

            Reflect.getParentPropertyNames(f).forEach(function (parentPropertyName:string) {
                o[parentPropertyName] = parent;
            });

            // iterate over all properties
            for (var propertyName in doc) {
                if( propertyName=="_className" || propertyName=="_serializationPath" )
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty:string = f ? Reflect.getObjectPropertyName(f, propertyName) : undefined;
                if(!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = Reflect.getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);

                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (Reflect.isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry:Document = value[i];
                            entry = this.toObjectRecursive(entry, o, propertyClass, handler, request);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[objectNameOfTheProperty] = result;
                    }
                    else {
                        o[objectNameOfTheProperty] = this.toObjectRecursive(value, o, propertyClass, handler, request );
                    }
                }
                else {
                    o[objectNameOfTheProperty] = Cloner.clone(value);
                    // o[objectNameOfTheProperty] = value;
                }
            }

        }
        return o;
    }

    toDocument( object:Object, includeContext?:boolean, omitPropertiesPrivateToServer?:boolean ):Document {
        return this.toDocumentRecursive(object, includeContext, omitPropertiesPrivateToServer);
    }

    private toDocumentRecursive(object:any, includeContext?:boolean, omitPropertiesPrivateToServer?:boolean, rootClass?:reob.TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var result:Document;
        if ( !object || typeof object == "string" || typeof object == "number"  || typeof object == "date" || typeof object == "boolean")
            result =  <Document>object;
        else if( Array.isArray(object) ){
            result = [];
            for( var i=0; i<object.length; i++ ){
                result[i] = this.toDocumentRecursive(object[i], includeContext);
            }
        } else {
            var objectClass =  Reflect.getClass(object);
            if( typeof (<any>objectClass).toDocument == "function" ){
                result = (<any>objectClass).toDocument( object );
            } else {
                var parentClass = Reflect.getClass(parentObject);
                {
                    result = this.createDocument(object, includeContext, omitPropertiesPrivateToServer, rootClass ? rootClass : Reflect.getClass(object), parentObject, propertyNameOnParentObject);
                }
            }
        }
        //console.log("returning document:",result);
        return result;
    }

    private createDocument(object:any, includeContext?:boolean, omitPropertiesPrivateToServer?:boolean, rootClass?:reob.TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
        var doc:any = {};
        var context = reob.SerializationPath.getObjectContext(object);
        if( includeContext ) {
            if (context && context.serializationPath)
                doc['_serializationPath'] = context.serializationPath.toString();
            var cls = reob.Reflect.getClass(object);
            if (cls && reob.Reflect.isEntity(cls)) {
                doc['_className'] = reob.Reflect.getClassName(cls);
            }
        }
        var objectClass = Reflect.getClass(object);
        for (var property in object) {
            var value = object[property];
            var documentNameOfTheProperty:string = Reflect.getDocumentPropertyName(objectClass,property);
            if( !documentNameOfTheProperty )
                documentNameOfTheProperty = property;
            var needsToBeOmittedBecauseItsPrivate = omitPropertiesPrivateToServer && Reflect.isPrivateToServer(objectClass, property);
            if (value !== undefined && !Reflect.isIgnored(objectClass, property) && !Reflect.isParent(objectClass, property) && !needsToBeOmittedBecauseItsPrivate ) {
                // primitives
                if( Reflect.getPropertyClass(objectClass,property) ) {

                    // array
                    if (Reflect.isArrayOrMap(objectClass, property)) {
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
                    // object
                    else if (typeof object[property] == 'object') {
                        doc[documentNameOfTheProperty] = this.toDocumentRecursive(value, includeContext, omitPropertiesPrivateToServer, rootClass, object, property);
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