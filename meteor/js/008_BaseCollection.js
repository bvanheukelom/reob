///<reference path="references.d.ts"/>
persistence;
(function (persistence) {
    var BaseCollection = (function () {
        function BaseCollection(persistableClass) {
            persistence.MeteorPersistence.init();
            var collectionName = persistence.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if (!persistence.MeteorPersistence.collections[collectionName]) {
                persistence.MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }
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
        BaseCollection.prototype.remove = function (t) {
            if (t) {
                if (t.getId && t.getId()) {
                    this.meteorCollection.remove(t.getId());
                }
                else
                    throw new Error("Trying to remove an object that does not have an id.");
            }
        };
        BaseCollection.prototype.documentToObject = function (doc) {
            var p = DeSerializer.Serializer.toObject(doc, this.theClass);
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
                var object = this.documentToObject(document);
                var result = updateFunction(object);
                persistence.MeteorPersistence.updatePersistencePaths(object);
                var documentToSave = DeSerializer.Serializer.toDocument(object);
                documentToSave.serial = currentSerial + 1;
                var updatedDocumentCount = this.meteorCollection.update({
                    _id: id,
                    serial: currentSerial
                }, documentToSave);
                if (updatedDocumentCount == 1) {
                    return result;
                }
                else if (updatedDocumentCount > 1)
                    throw new Meteor.Error("verifiedUpdate should only update one document");
                else {
                    console.log("rerunning verified update ");
                }
            }
            throw new Error("update gave up after 10 attempts to update the object ");
        };
        BaseCollection.prototype.insert = function (p, cb) {
            var doc = DeSerializer.Serializer.toDocument(p);
            if (p.getId())
                doc._id = p.getId();
            doc.serial = 0;
            console.log("inserting document: ", doc);
            var that = this;
            this.meteorCollection.insert(doc, function (error, resultId) {
                if (cb) {
                    var result = that.getById(resultId);
                    persistence.MeteorPersistence.updatePersistencePaths(result);
                    if (!error)
                        cb(undefined, result);
                    else
                        cb(error);
                }
            });
            console.log("inserting object: ", p, p.wood);
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
