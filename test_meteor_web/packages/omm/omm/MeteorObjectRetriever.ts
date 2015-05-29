/// <reference path="./../serializer/ObjectRetriever.ts" />

module omm {
    export class MeteorObjectRetriever implements omm.ObjectRetriever {
        getId(object:Persistable):string {
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

        // sets all references that are within the root object
        retrieveLocalKeys(o:Object, visited?:Array<Object>, rootObject?:Object):void {
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
            var spp = rootObject["_serializationPath"];
            var that = this;
            omm.PersistenceAnnotation.getTypedPropertyNames(theClass).forEach( function( properyName:string ){
                console.log("Retrieviing local keys for property "+properyName);
                var isKeys = omm.PersistenceAnnotation.isStoredAsForeignKeys(theClass, properyName);
                var needsLazyLoading = omm.Serializer.needsLazyLoading(o, properyName);
                var isArray = omm.PersistenceAnnotation.isArrayOrMap(theClass, properyName );
                if( isKeys && needsLazyLoading && !isArray ){
                    var key:string = o["_"+properyName];
                    var pp:omm.SerializationPath = new omm.SerializationPath(that, key);
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