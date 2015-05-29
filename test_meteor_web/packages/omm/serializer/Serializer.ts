///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./SerializationPath.ts"/>
///<reference path="./Document.ts"/>

module omm{
    export class Serializer {
        private objectRetriever:ObjectRetriever;

        constructor(retri:ObjectRetriever){
            this.objectRetriever = retri;
        }

        static init(){
            omm.PersistenceAnnotation.getEntityClasses().forEach(function (c:TypeClass<Persistable>) {
                Serializer.installLazyLoaderGetterSetters(c);
            });
        }

        private static installLazyLoaderGetterSetters(c:TypeClass<omm.Persistable>){
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
                                var objectRetriever:omm.ObjectRetriever = (<omm.Persistable>this)._serializationPath.getObjectRetriever();
                                if (typeof v == "string") {
                                    console.log("Lazy loading " + className + "." + propertyName);
                                    v = objectRetriever.getObject(v);
                                    this[propertyName] = v;
                                }
                                else  // TODO this could be improved so that it loads them when they are accessed rather than to load them all at once
                                {
                                    console.log("Lazy loading array/map " + className + "." + propertyName);
                                    for( var i in v )
                                    {
                                        var ele = v[i];
                                        v[i] = objectRetriever.getObject(ele);
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
                else
                    console.log("On Class " + className + ": no lazy loader for " + propertyName);

            });
        }

        private setSerializationPath( o:omm.Persistable, pPath:omm.SerializationPath ){
            if (!Object.getOwnPropertyDescriptor(o, "_serializationPath")) {
                Object.defineProperty(this, "_serializationPath", {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            o._serializationPath = pPath
        }

        static needsLazyLoading(object:Persistable, propertyName:string) {
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


        // if I could I would make this package protected
        _updateSerializationPaths(object:Persistable, visited?:Array<Persistable>):void {
            var that = this;
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            if( !object || typeof object!="object" )
                return;

            visited.push(object);
            var objectClass = PersistenceAnnotation.getClass(object);
            if (PersistenceAnnotation.isRootEntity(objectClass)) {
                if (!object._serializationPath) {
                    if ( object.getId())
                        this.setSerializationPath( object, new omm.SerializationPath(this.objectRetriever, PersistenceAnnotation.getCollectionName(objectClass), object.getId()) );
                }
            }
            if (!object._serializationPath)
                return; // we're done here
            PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
                if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v:Persistable = object[typedPropertyName];
                    if (v) {
                        if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            //console.log("updating foreignkey property " + typedPropertyName + " is array");
                            for (var i in v) {
                                var e = v[i];
                                //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                                if (e.getId && e.getId()) {
                                    that.setSerializationPath(e, object._serializationPath.clone());
                                    e._serializationPath.appendArrayOrMapLookup(typedPropertyName, e.getId());
                                    that._updateSerializationPaths(e, visited);
                                }
                                else
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + className(objectClass) + " does not have an id. Total serialization path so far:" + object._serializationPath.toString());
                            }
                        }
                        else {
                            //console.log("updating foreignkey property direct property " + typedPropertyName);
                            that.setSerializationPath( v, object._serializationPath.clone() );
                            v._serializationPath.appendPropertyLookup(typedPropertyName);
                            that._updateSerializationPaths(v, visited);
                        }
                    }

                }
                else {
                    //console.log( "foreign key "+typedPropertyName );
                    if (!Serializer.needsLazyLoading(object, typedPropertyName)) {
                        var v:Persistable = object[typedPropertyName];
                        if (v) {
                            if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e._serializationPath) {
                                        //console.log("non- foreign key array/map entry key:"+i+" value:"+e);
                                        that._updateSerializationPaths(e, visited);
                                    }
                                }
                            }
                            else if (!v._serializationPath)
                                that._updateSerializationPaths(v, visited);
                        }
                    }
                }
            });
        }

        toObject<T extends omm.Persistable>(doc:Document, f:omm.TypeClass<T>):T {
            var o:T = this.toObjectRecursive(doc,f);
            this._updateSerializationPaths(o);
            console.log("before retrieving local keys:", o);
            this.retrieveLocalKeys(o);
            return o;
        }

        private toObjectRecursive<T extends omm.Persistable>(doc:Document, f:omm.TypeClass<T>):T {
            var o:any;
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
                o = Object.create(f.prototype);

                // iterate over all properties
                for (var propertyName in doc) {
                    var value = doc[propertyName];
                    var propertyClass = omm.PersistenceAnnotation.getPropertyClass(f, propertyName);
                    var isStoredAsKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(f, propertyName);
                    if (propertyClass && !isStoredAsKeys) {
                        if (omm.PersistenceAnnotation.isArrayOrMap(f, propertyName)) {
                            var result = Array.isArray(value) ? [] : {};
                            for (var i in value) {
                                var entry = value[i];
                                entry = this.toObjectRecursive(entry, propertyClass);
                                result[i] = entry;
                            }
                            // this can only happen once because if the property is accessed the "lazy load" already kicks in
                            o[propertyName] = result;
                        }
                        else {
                            o[propertyName] = this.toObjectRecursive(value, propertyClass);
                        }
                    }
                    else {
                        o[propertyName] = value;
                    }
                }
            }
            return o;
        }
        toDocument(object:omm.Persistable ):omm.Document {
            return this.toDocumentRecursive(object);
        }
        private toDocumentRecursive(object:omm.Persistable, rootClass?:omm.TypeClass<omm.Persistable>, parentObject?:omm.Persistable, propertyNameOnParentObject?:string):omm.Document {
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

        private createDocument(object:any, rootClass?:omm.TypeClass<omm.Persistable>, parentObject?:omm.Persistable, propertyNameOnParentObject?:string):Document {
            var doc:any = {};
            var objectClass = omm.PersistenceAnnotation.getClass(object);
            for (var property in object) {
                var value = object[property];
                if (value !== undefined && property != "_serializationPath") {
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
                            doc[property] = result;
                        }
                        // object
                        else if (typeof object[property] == 'object') {
                            doc[property] = this.toDocumentRecursive(value, rootClass, object, property);
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

        private retrieveLocalKeys(o:Object, visited?:Array<Object>, rootObject?:omm.Persistable):void {
            if( !o )
                return;
            if( !visited )
                visited = [];
            if( visited.indexOf(o)!=-1 )
                return;
            visited.push(o);
            var that = this;
            if( !rootObject )
                rootObject = o;
            var theClass = omm.PersistenceAnnotation.getClass(o);
            console.log("Retrieving local keys for ",o," class: ", theClass);
            var spp = rootObject._serializationPath;
            if( spp ){ // can only retrieve local keys if there is a definition of what "local" means.
                var that = this;
                omm.PersistenceAnnotation.getTypedPropertyNames(theClass).forEach( function( properyName:string ){
                    console.log("Retrieviing local keys for property "+properyName);
                    var isKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(theClass, properyName);
                    var needsLazyLoading = omm.Serializer.needsLazyLoading(o, properyName);
                    var isArray = omm.PersistenceAnnotation.isArrayOrMap(theClass, properyName );
                    if( isKeys && needsLazyLoading && !isArray ){
                        var key:string = o["_"+properyName];
                        var pp:omm.SerializationPath = new omm.SerializationPath(this.objectRetriever, key);
                        if( pp.getCollectionName()==spp.getCollectionName() && pp.getId()==spp.getId() ) {
                            console.log("found a local key :"+properyName);
                            o[properyName] = pp.getSubObject(rootObject);
                        }
                    }
                    if(!omm.Serializer.needsLazyLoading(o, properyName) )
                    {
                        if( isArray )
                        {
                            for( var i in o[properyName] ) {
                                that.retrieveLocalKeys(o[properyName][i], visited, rootObject);
                            }
                        }
                        else
                            that.retrieveLocalKeys(o[properyName], visited, rootObject);
                    }
                } );
            }



        }

    }
}