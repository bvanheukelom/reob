///<reference path="references.d.ts"/>
persistence;
(function (persistence) {
    var BaseCollection = (function () {
        function BaseCollection(persistableClass) {
            this.serializer = new DeSerializer.Serializer(new persistence.MeteorObjectRetriever());
            persistence.MeteorPersistence.init();
            var collectionName = persistence.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if (!persistence.MeteorPersistence.collections[collectionName]) {
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
        BaseCollection.prototype.remove = function (id, cb) {
            if (Meteor.isServer) {
                if (id) {
                    this.meteorCollection.remove(id, cb);
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
                var object = this.documentToObject(document);
                var result = updateFunction(object);
                persistence.MeteorPersistence.updatePersistencePaths(object);
                var documentToSave = this.serializer.toDocument(object);
                documentToSave.serial = currentSerial + 1;
                console.log("writing document ", documentToSave);
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
            if (Meteor.isServer) {
                var doc = this.serializer.toDocument(p);
                if (typeof p.getId == "function" && p.getId())
                    doc._id = p.getId();
                doc.serial = 0;
                console.log("inserting document: ", doc);
                var that = this;
                var id = this.meteorCollection.insert(doc, function (error, id) {
                    if (!error) {
                        console.log("inserted into '" + that.getName() + "' new id:" + id);
                        if (typeof p.setId == "function")
                            p.setId(id);
                        persistence.MeteorPersistence.updatePersistencePaths(p);
                    }
                    else
                        console.log("inserted into '" + this.getName() + "' error:" + error);
                    cb(error, id);
                });
            }
            else
                throw new Error("Insert can not be called on the client. Wrap it into a meteor method.");
        };
        BaseCollection.resetAll = function (cb) {
            var arr = [];
            for (var i in BaseCollection.meteorCollections)
                arr.push(BaseCollection.meteorCollections[i]);
            if (arr.length > 0) {
                for (var j in arr) {
                    if (j != arr.length - 1)
                        Meteor.wrapAsync(function (cb2) {
                            arr[j].remove({}, cb2);
                        })();
                    else {
                        arr[j].remove({}, cb);
                    }
                }
            }
            else
                cb();
        };
        BaseCollection.meteorCollections = {};
        return BaseCollection;
    })();
    persistence.BaseCollection = BaseCollection;
})(persistence || (persistence = {}));
persistence.MeteorPersistence.wrapFunction(persistence.BaseCollection, "resetAll", "resetAll", true, null, new persistence.ConstantObjectRetriever(persistence.BaseCollection));
