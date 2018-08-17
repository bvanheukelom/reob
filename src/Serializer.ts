
import * as Cloner from "./Cloner"
import { Document } from "./Document"

import { SubObjectPath } from "./SubObjectPath"
import { getId, TypeClass, SerializationPath, Request, Handler} from "./reob"
import {
    getClass,
    getClassName,
    getDocumentPropertyName, getEntityClassByName,
    getObjectPropertyName, getParentPropertyNames, getPostCreateFunctionNames, getPropertyClass, getTypedPropertyNames,
    isArrayOrMap, isEntity, isIgnored,
    isParent, isPrivateToServer
} from "./Annotations";

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
        var objectClass = getClass(object);
        getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
            if( !isParent(objectClass, typedPropertyName) ) {
                //console.log("updating foreignkey property " + typedPropertyName);
                var v:Object = object[typedPropertyName];
                if (v) {
                    if (isArrayOrMap(objectClass, typedPropertyName)) {
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

    toObject(doc:Document, handler?:any, f?:TypeClass<any>, serializationPath?:SerializationPath, request?:Request ):any {
        var o:any;
        if(Array.isArray(doc)){
            var r = [];
            for( var j=0; j<(<Array<any>>doc).length; j++ ){
                r[j] = this.toObject(doc[j], handler, f );
            }
            o = <any>r;
        } else if ( !doc || typeof doc == "string" || typeof doc == "number"   || typeof doc == "boolean")
            o =  doc;
        else
            o =  this.toObjectRecursive(doc, undefined, undefined, f, handler, request);

        if( handler && serializationPath ) {
            SerializationPath.setObjectContext(o, serializationPath, handler, request);
            SerializationPath.updateObjectContexts(o, handler, request);
        }

        return o;
    }

    private toObjectRecursive<T extends Object>(doc:Document, parent:Object, parentPropertyName:string, f:TypeClass<T>, handler:Handler, request:Request):T {
        var o:T;
        if( !doc )
            return <T>doc;
        if(typeof doc=="function")
            throw new Error("Error in 'toObject'. doc is a function.");



        if ( f && typeof f["toObject"]=="function" ) {
                //console.log("using the custom toObject function of class "+omm.className(f));
                o = f["toObject"](doc, this, parent, parentPropertyName );
        } else {
            // if the document contains a property called "className" it defines the class that's going to be instantiated
            if (doc._className){
                f = getEntityClassByName(doc._className);
            }
            if(!f)
                return Cloner.clone(doc);

            //     throw new Error("Could not determine class of document. Either the document needs to have a '_className' property or a class needs to be passed to the serializer. Document: "+ JSON.stringify( doc ) );

            // instantiate the new object
            if( f && f.prototype ){
                o = Object.create(f.prototype);


            }
            else
                o = <any>{};

            if( doc._serializationPath ){
                var sp = new SerializationPath(doc._serializationPath);
                SerializationPath.setObjectContext(o, sp, handler, request);
            }

            getParentPropertyNames(f).forEach(function (parentPropertyName:string) {
                o[parentPropertyName] = parent;
            });

            // iterate over all properties
            for (var propertyName in doc) {
                if( propertyName=="_className" || propertyName=="_serializationPath" )
                    continue;
                var value = doc[propertyName];
                var objectNameOfTheProperty:string = f ? getObjectPropertyName(f, propertyName) : undefined;
                if(!objectNameOfTheProperty)
                    objectNameOfTheProperty = propertyName;
                var propertyClass = getPropertyClass(f, objectNameOfTheProperty);
                // var isStoredAsKeys = PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);

                if (propertyClass /*&& !isStoredAsKeys*/) {
                    if (isArrayOrMap(f, objectNameOfTheProperty)) {
                        var result = Array.isArray(value) ? [] : {};
                        for (var i in value) {
                            var entry:Document = value[i];
                            entry = this.toObjectRecursive(entry, o, propertyName,  propertyClass, handler, request);
                            result[i] = entry;
                        }
                        // this can only happen once because if the property is accessed the "lazy load" already kicks in
                        o[objectNameOfTheProperty] = result;
                    }
                    else {
                        o[objectNameOfTheProperty] = this.toObjectRecursive(value, o, propertyName,  propertyClass, handler, request );
                    }
                }
                else {
                    o[objectNameOfTheProperty] = Cloner.clone(value);
                    // o[objectNameOfTheProperty] = value;
                }
            }

            // call "postCreate" functions
            let postCreateFunctionNames = getPostCreateFunctionNames(f);
            if( postCreateFunctionNames ){
                postCreateFunctionNames.forEach( functionName =>{
                    o[functionName]();
                });
            }
        }
        return o;
    }

    // this is the function that gets called when the process of converting an object to a document starts.
    // its called once in the process
    toDocument( object:Object, includeContext?:boolean, omitPropertiesPrivateToServer?:boolean ):Document {
        const objectClass = getClass(object);
        const result =  this.toDocumentRecursive(object, objectClass, omitPropertiesPrivateToServer);
        // console.log("returning document:",result);
        return result;

    }

    private toDocumentRecursive(object:any, expectedClass?:TypeClass<any>, includeContext?:boolean,  omitPropertiesPrivateToServer?:boolean ):Document {
        var result:Document;
        var objectClass = getClass(object);
        var context = SerializationPath.getObjectContext(object);
        // console.log(" documenting ", object,  typeof object);

        // is there a customized way to create a document ?
        if( objectClass && typeof (<any>objectClass).toDocument == "function" ) {
            result = (<any>objectClass).toDocument(object, this, includeContext, omitPropertiesPrivateToServer);
        }

        // is it a simple type ?
        else if ( !object || typeof object == "string" || typeof object == "number" || typeof object == "boolean") {
            result = <Document>object;
        }

        // is it an array or dictionary/map-object?
        else if( Array.isArray(object) || isArrayOrMap(objectClass, property) ) {
            result = Array.isArray(object) ? [] : {};
            const expectedClass = getPropertyClass(objectClass,property);
            for (var property in object) {
                const subDoc = this.toDocumentRecursive(object[property], expectedClass, includeContext, omitPropertiesPrivateToServer);
                result[property] = subDoc;
            }
        }

        // is it an object?
        else if( typeof object == "object" ){
            result = {};

            // for all enumerable properties in the object ...
            for (var property in object) {
                const value = object[property];
                const expectedClass = getPropertyClass(objectClass,property);

                // figure out if the property needs to be part of the document or not
                let canBeIgnored = omitPropertiesPrivateToServer && isPrivateToServer(objectClass, property); // its private to the server
                canBeIgnored = canBeIgnored || isIgnored(objectClass, property);
                canBeIgnored = canBeIgnored || value === undefined; // it's undefined
                canBeIgnored = canBeIgnored || isParent(objectClass, property); // parent properties are not part of documents, they're deducted
                canBeIgnored = canBeIgnored || typeof value === "function"; // its's a function


                if ( !canBeIgnored ) {
                    let documentNameOfTheProperty:string = getDocumentPropertyName(objectClass,property) || property;
                    const subDoc = this.toDocumentRecursive(value, expectedClass, includeContext, omitPropertiesPrivateToServer );
                    result[documentNameOfTheProperty] = subDoc;
                }
            }

            // add the serialization path if needed (for network)
            if (includeContext && context && context.serializationPath){
                result['_serializationPath'] = context.serializationPath.toString();
            }

            // add the object class if it deviates from what's expected or its required
            if ( objectClass && isEntity(objectClass) && ( includeContext || expectedClass!=objectClass ) ) {
                result['_className'] = getClassName(objectClass);
            }

        }else if( typeof object == "function" ) {
            // ignore
        }
        else {
            throw new Error( "Unexpected object type :"+(typeof object));
        }

        // console.log(" documenting result:", result);
        return result;
    }


}