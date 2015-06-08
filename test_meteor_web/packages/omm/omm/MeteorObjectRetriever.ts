/// <reference path="./../serializer/ObjectRetriever.ts" />
///<reference path="./SerializationPath.ts"/>

module omm {
    export interface MeteorPersistable extends omm.Persistable{
        _serializationPath?:omm.SerializationPath;
    }

    export class MeteorObjectRetriever implements omm.ObjectRetriever {
        getId(object:MeteorPersistable):string {
            if (object._serializationPath)
                return object._serializationPath.toString();
            else {
                var objectClass = omm.PersistenceAnnotation.getClass(object);
                if (omm.PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                    return new omm.SerializationPath(this, omm.PersistenceAnnotation.getCollectionName(objectClass), object.getId()).toString();
                }
                else {
                    throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
                }
            }
        }

        getObject(s:string):Object {
            if (typeof s != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath(this, s);
            //var typeClass:TypeClass<any> = mapper.PersistenceAnnotation.getCollectionName(persistencePath.getClassName());
            //if (!typeClass || typeof typeClass != "function")
            //    throw new Error("Could not load path. No class found for class name :" + persistencePath.getClassName() + ". Key:" + s);
            var collectionName = sPath.getCollectionName();
            var collection:omm.BaseCollection<Persistable> = collectionName ? omm.MeteorPersistence.collections[collectionName] : undefined;
            if (collection) {
                var rootValue = collection.getById(sPath.getId());
                var newValue = rootValue ? sPath.getSubObject(rootValue) : undefined;
                return newValue;
            }
            else
                throw new Error("No collection found to retrieve object. Key:" + s);
        }

        preToDocument( o:Object ){
            // noop
        }

        postToObject( o:Object ){
            this.updateSerializationPaths(o);
            this.retrieveLocalKeys(o);
        }

        private setSerializationPath( o:omm.MeteorPersistable, pPath:omm.SerializationPath ){
            omm.setNonEnumerableProperty(o, "_serializationPath", pPath);
            omm.setNonEnumerableProperty(o, "_objectRetriever", this);
        }

        // if I could I would make this package protected
        updateSerializationPaths(object:MeteorPersistable, visited?:Array<Persistable>):void {
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
                        this.setSerializationPath( object, new omm.SerializationPath(this, PersistenceAnnotation.getCollectionName(objectClass), object.getId()) );
                }
            }
            if (!object._serializationPath)
                return; // we're done here


            PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
                if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v:MeteorPersistable = object[typedPropertyName];
                    if (v) {
                        if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            //console.log("updating foreignkey property " + typedPropertyName + " is array");
                            for (var i in v) {
                                var e = v[i];
                                var index = i;
                                if( e.getId && e.getId() )
                                    index = e.getId();
                                //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                                that.setSerializationPath(e, object._serializationPath.clone());
                                e._serializationPath.appendArrayOrMapLookup(typedPropertyName, index);
                                that.updateSerializationPaths(e, visited);
                            }
                        }
                        else {
                            //console.log("updating foreignkey property direct property " + typedPropertyName);
                            that.setSerializationPath( v, object._serializationPath.clone() );
                            v._serializationPath.appendPropertyLookup(typedPropertyName);
                            that.updateSerializationPaths(v, visited);
                        }
                    }

                }
                else {
                    //console.log( "foreign key "+typedPropertyName );
                    if (!Serializer.needsLazyLoading(object, typedPropertyName)) {
                        var v:MeteorPersistable = object[typedPropertyName];
                        if (v) {
                            if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e._serializationPath) {
                                        //console.log("non- foreign key array/map entry key:"+i+" value:"+e);
                                        that.updateSerializationPaths(e, visited);
                                    }
                                }
                            }
                            else if (!v._serializationPath)
                                that.updateSerializationPaths(v, visited);
                        }
                    }
                }
            });
        }


        retrieveLocalKeys(o:omm.MeteorPersistable, visited?:Array<Object>, rootObject?:omm.MeteorPersistable):void {
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
            //console.log("Retrieving local keys for ",o," class: ", theClass);
            var spp = rootObject._serializationPath;
            if( spp ){ // can only retrieve local keys if there is a definition of what "local" means.
                var that = this;
                omm.PersistenceAnnotation.getTypedPropertyNames(theClass).forEach( function( properyName:string ){
                    //console.log("Retrieviing local keys for property "+properyName);
                    var isKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(theClass, properyName);
                    var needsLazyLoading = omm.Serializer.needsLazyLoading(o, properyName);
                    var isArray = omm.PersistenceAnnotation.isArrayOrMap(theClass, properyName );
                    if( isKeys && needsLazyLoading && !isArray ){
                        var key:string = o["_"+properyName];

                        // this is where it is determined if an object is local
                        var pp:omm.SerializationPath = new omm.SerializationPath(this, key);
                        if( pp.getCollectionName()==spp.getCollectionName() && pp.getId()==spp.getId() ) {
                            //console.log("found a local key :"+properyName);
                            o[properyName] = pp.getSubObject(rootObject);
                        }
                    }
                    // TODO support arrays
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


        // sets all references that are within the root object

    }
}