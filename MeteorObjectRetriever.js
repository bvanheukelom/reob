///<reference path="references.d.ts"/>
var persistence;
(function (persistence) {
    var MeteorObjectRetriever = (function () {
        function MeteorObjectRetriever() {
        }
        MeteorObjectRetriever.prototype.getId = function (object) {
            if (object.persistencePath)
                return object.persistencePath.toString();
            else {
                var objectClass = persistence.PersistenceAnnotation.getClass(object);
                if (persistence.PersistenceAnnotation.isRootEntity(objectClass) && object.getId()) {
                    return new persistence.PersistencePath(persistence.PersistenceAnnotation.getCollectionName(objectClass), object.getId()).toString();
                }
                else {
                    throw new Error("Error while 'toString'. Objects that should be stored as foreign keys need to be persisted beforehand or be the root entity of a collection and have an id.");
                }
            }
        };
        MeteorObjectRetriever.prototype.getObject = function (s) {
            if (typeof s != "string")
                throw new Error("Path needs to be a string");
            var persistencePath = new persistence.PersistencePath(s);
            var collectionName = persistencePath.getCollectionName();
            var collection = collectionName ? persistence.MeteorPersistence.collections[collectionName] : undefined;
            if (collection) {
                var rootValue = collection.getById(persistencePath.getId());
                var newValue = rootValue ? persistencePath.getSubObject(rootValue) : undefined;
                return newValue;
            }
            else
                throw new Error("No collection found to retrieve object. Key:" + s);
        };
        return MeteorObjectRetriever;
    })();
    persistence.MeteorObjectRetriever = MeteorObjectRetriever;
})(persistence || (persistence = {}));
//# sourceMappingURL=MeteorObjectRetriever.js.map