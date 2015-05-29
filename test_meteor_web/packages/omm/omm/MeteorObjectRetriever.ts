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

    }
}