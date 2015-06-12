///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./Document.ts"/>
///<reference path="./SubObjectPath.ts"/>

module omm{
    export class Serializer {
        private objectRetriever:ObjectRetriever;

        constructor(retri:ObjectRetriever){
            this.objectRetriever = retri;
        }

        static init(){
            omm.PersistenceAnnotation.getEntityClasses().forEach(function (c:TypeClass<Object>) {
                Serializer.installLazyLoaderGetterSetters(c);
            });
        }

        private static installLazyLoaderGetterSetters(c:TypeClass<Object>){
            PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName:string) {
                if (PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
                    //console.log("On Class " + className + ": creating lazy loader for " + propertyName);
                    var propertyDescriptor = Object.getOwnPropertyDescriptor(c.prototype, propertyName);

                    Object.defineProperty(c.prototype, propertyName, {
                        get: function ():any {
                            // TODO this doesnt work for subdocuments
                            //console.log("Monkey patched getter "+propertyName);
                            var v:any;
                            if (propertyDescriptor && propertyDescriptor.get)
                                v = propertyDescriptor.get.apply(this);
                            else
                                v = this["_" + propertyName];
                            if (Serializer.needsLazyLoading(this, propertyName)) {
                                var objectRetriever:omm.ObjectRetriever = this["_objectRetriever"];
                                if (typeof v == "string") {
                                    //console.log("Lazy loading " + className + "." + propertyName);
                                    v = objectRetriever.getObject(v, this, propertyName );
                                    this[propertyName] = v;
                                }
                                else  // TODO this could be improved so that it loads them when they are accessed rather than to load them all at once
                                {
                                    //console.log("Lazy loading array/map " + className + "." + propertyName);
                                    for( var i in v )
                                    {
                                        var ele = v[i];
                                        v[i] = objectRetriever.getObject(ele, this, propertyName );
                                    }
                                }
                            }
                            //console.log("Monkey patched getter "+propertyName+" returns ",v);
                            return v;
                        },
                        set: function (v:any) {
                            //console.log("Monkey patched setter " + propertyName + " v:" + v);

                            if (propertyDescriptor && propertyDescriptor.set)
                                propertyDescriptor.set.apply(this, arguments);
                            else {
                                if (!Object.getOwnPropertyDescriptor(this, "_" + propertyName)) {
                                    Object.defineProperty(this, "_" + propertyName, {
                                        configurable: false,
                                        enumerable: false,
                                        writable: true
                                    });
                                }
                                this["_" + propertyName] = v;
                            }
                        },
                        configurable: propertyDescriptor ? propertyDescriptor.configurable : true,
                        enumerable: propertyDescriptor ? propertyDescriptor.enumerable : true
                    });
                }
                else{
                    //console.log("On Class " + className + ": no lazy loader for " + propertyName);
                }

            });
        }

        static forEachTypedObject(object:Object, cb:(path:omm.SubObjectPath, object:Object)=>void ){
            this.forEachTypedObjectRecursive(object,object, new omm.SubObjectPath(), [], cb);

        }

        static  forEachTypedObjectRecursive(rootObject:Object, object:Object, path:omm.SubObjectPath, visited:Array<Object>,cb:(path:omm.SubObjectPath, object:Object)=>void):void {
            var that = this;
            if (visited.indexOf(object) != -1)
                return;
            if (!object || typeof object != "object")
                return;
            visited.push(object);

            cb(path, object);
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
                if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v:Object = object[typedPropertyName];
                    if (v) {
                        if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            //console.log("updating foreignkey property " + typedPropertyName + " is array");
                            for (var i in v) {
                                var e = v[i];
                                //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                                var subObjectPath = path.clone();
                                if (e.getId && e.getId()) {
                                    subObjectPath.appendArrayOrMapLookup(typedPropertyName, e.getId());
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


        static needsLazyLoading(object:Object, propertyName:string) {
            // TODO inheritance
            var oc = PersistenceAnnotation.getClass(object);
            if( omm.PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName ) )
            {
                var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
                var shadowPropertyIsKeys = false;
                if (shadowpropertyDescriptor)
                    if (typeof object["_" + propertyName] == "string")
                        shadowPropertyIsKeys = true;
                    else if (omm.PersistenceAnnotation.isArrayOrMap(oc, propertyName)) {
                        var v = object["_" + propertyName];
                        for( var i in v )
                        {
                            if(typeof v[i] =="string" )
                                shadowPropertyIsKeys = true;
                            break;

                        }
                    }
                return shadowPropertyIsKeys;
            }
            else
                return false;

        }

        toObject<T extends Object>(doc:Document, f:omm.TypeClass<T>):T {
            var o:T = this.toObjectRecursive(doc,f);
            this.objectRetriever.postToObject(o);
            return o;
        }

        private toObjectRecursive<T extends Object>(doc:Document, f:omm.TypeClass<T>):T {
            var o:T;
            if( !doc )
                return <T>doc;
            if(typeof doc=="function")
                throw new Error("Error in 'toObject'. doc is a function.");

            if ( typeof f["toObject"]=="function" ) {
                    //console.log("using the custom toObject function of class "+omm.className(f));
                    o = f["toObject"](doc);
            } else {
                // if the document contains a property called "className" it defines the class that's going to be instantiated
                if (doc.className)
                    f = omm.PersistenceAnnotation.getEntityClassByName(doc.className);

                // instantiate the new object
                o = new f();

                // iterate over all properties
                for (var propertyName in doc) {
                    var value = doc[propertyName];
                    var objectNameOfTheProperty:string = omm.PersistenceAnnotation.getObjectPropertyName(f, propertyName);
                    if(!objectNameOfTheProperty)
                        objectNameOfTheProperty = propertyName;
                    var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, objectNameOfTheProperty);
                    var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, objectNameOfTheProperty);
                    if (propertyClass && !isStoredAsKeys) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(f, objectNameOfTheProperty)) {
                            var result = Array.isArray(value) ? [] : {};
                            for (var i in value) {
                                var entry:omm.Document = value[i];
                                entry = this.toObjectRecursive(entry, propertyClass);
                                result[i] = entry;
                            }
                            // this can only happen once because if the property is accessed the "lazy load" already kicks in
                            o[objectNameOfTheProperty] = result;
                        }
                        else {
                            o[objectNameOfTheProperty] = this.toObjectRecursive(value, propertyClass);
                        }
                    }
                    else {
                        o[objectNameOfTheProperty] = value;
                    }
                }
            }
            omm.setNonEnumerableProperty(o, "_objectRetriever", this.objectRetriever);
            //o._objectRetriever = this.objectRetriever;
            return o;
        }

        toDocument(object:Object ):omm.Document {
            this.objectRetriever.preToDocument( object );
            return this.toDocumentRecursive(object);
        }

        private toDocumentRecursive(object:Object, rootClass?:omm.TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):omm.Document {
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

        private createDocument(object:any, rootClass?:omm.TypeClass<Object>, parentObject?:Object, propertyNameOnParentObject?:string):Document {
            var doc:any = {};
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                var documentNameOfTheProperty:string = omm.PersistenceAnnotation.getDocumentPropertyName(objectClass,property);
                if( !documentNameOfTheProperty )
                    documentNameOfTheProperty = property;
                if (value !== undefined && !omm.PersistenceAnnotation.isIgnored(objectClass, property)) {
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
}