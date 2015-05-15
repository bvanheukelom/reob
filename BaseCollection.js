///<reference path="references.d.ts"/>
var persistence;
(function (persistence) {
    var BaseCollection = (function () {
        function BaseCollection(persistableClass) {
            this.serializer = new DeSerializer.Serializer(new MeteorObjectRetriever());
            persistence.MeteorPersistence.init();
            var collectionName = persistence.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if (!persistence.MeteorPersistence.collections[collectionName]) {
                // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
                persistence.MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }
        BaseCollection.getCollection = function (t) {
            return persistence.MeteorPersistence.collections[persistence.PersistenceAnnotation.getCollectionName(t)];
        };
        BaseCollection._getMeteorCollection = function (name) {
            if (!BaseCollection.meteorCollections[name]) {
                BaseCollection.meteorCollections[name] = new Meteor.Collection(name);
            }
            return BaseCollection.meteorCollections[name];
        };
        BaseCollection.prototype.getName = function () {
            return this.name;
        };
        BaseCollection.prototype.getMeteorCollection = function () {
            return this.meteorCollection;
        };
        BaseCollection.prototype.getById = function (id) {
            var o = this.find({
                "_id": id
            });
            return o.length > 0 ? o[0] : undefined;
        };
        BaseCollection.prototype.find = function (findCriteria) {
            var documents = this.meteorCollection.find(findCriteria).fetch();
            var objects = [];
            for (var i = 0; i < documents.length; i++) {
                var document = documents[i];
                objects[i] = this.documentToObject(document);
            }
            return objects;
        };
        BaseCollection.prototype.getAll = function () {
            return this.find({});
        };
        BaseCollection.prototype.remove = function (id) {
            if (Meteor.isServer) {
                if (id) {
                    this.meteorCollection.remove(id);
                }
                else
                    throw new Error("Trying to remove an object that does not have an id.");
            }
            else
                throw new Error("Trying to remove an object from the client. 'remove' can only be called on the server.");
        };
        BaseCollection.prototype.documentToObject = function (doc) {
            var p = this.serializer.toObject(doc, this.theClass);
            persistence.MeteorPersistence.updatePersistencePaths(p);
            return p;
        };
        BaseCollection.prototype.update = function (id, updateFunction) {
            if (!id)
                throw new Error("Id missing");
            for (var i = 0; i < 10; i++) {
                var document = this.meteorCollection.findOne({
                    _id: id
                });
                if (!document)
                    return undefined;
                var currentSerial = document.serial;
                // call the update function
                var object = this.documentToObject(document);
                var result = updateFunction(object);
                persistence.MeteorPersistence.updatePersistencePaths(object);
                var documentToSave = this.serializer.toDocument(object);
                documentToSave.serial = currentSerial + 1;
                // update the collection
                //console.log("writing document ", documentToSave);
                var updatedDocumentCount = this.meteorCollection.update({
                    _id: id,
                    serial: currentSerial
                }, documentToSave);
                // verify that that went well
                if (updatedDocumentCount == 1) {
                    return result; // we're done
                }
                else if (updatedDocumentCount > 1)
                    throw new Meteor.Error("verifiedUpdate should only update one document");
                else {
                    console.log("rerunning verified update ");
                }
            }
            throw new Error("update gave up after 10 attempts to update the object ");
        };
        BaseCollection.prototype.insert = function (p) {
            if (Meteor.isServer) {
                var doc = this.serializer.toDocument(p);
                if (p.getId())
                    doc._id = p.getId();
                doc.serial = 0;
                console.log("inserting document: ", doc);
                var that = this;
                var id = this.meteorCollection.insert(doc);
                p.setId(id);
                persistence.MeteorPersistence.updatePersistencePaths(p);
                console.log("inserting object: ", p, p.wood);
            }
            else
                throw new Error("Insert can not be called on the client. Wrap it into a meteor method.");
        };
        BaseCollection.prototype.removeAll = function (cb) {
            if (!this.name)
                throw new Error("Collection has no name");
            console.log("removing all of collection " + this.name);
            Meteor.call("removeAll", this.name, cb);
        };
        BaseCollection.meteorCollections = {};
        return BaseCollection;
    })();
    persistence.BaseCollection = BaseCollection;
})(persistence || (persistence = {}));
if (Meteor.isServer) {
    Meteor.methods({
        removeAll: function (collectionName) {
            check(collectionName, String);
            persistence.MeteorPersistence.collections[collectionName].getMeteorCollection().remove({});
        }
    });
}
//# sourceMappingURL=BaseCollection.js.map