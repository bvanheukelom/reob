///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var BaseCollection = (function () {
        function BaseCollection(persistableClass) {
            this.serializer = new DeSerializer.Serializer(new mapper.MeteorObjectRetriever());
            var collectionName = mapper.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if (!mapper.MeteorPersistence.collections[collectionName]) {
                mapper.MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }
        BaseCollection.getCollection = function (t) {
            return mapper.MeteorPersistence.collections[mapper.PersistenceAnnotation.getCollectionName(t)];
        };
        BaseCollection._getMeteorCollection = function (name) {
            if (!BaseCollection.meteorCollections[name]) {
                if (name != "users") {
                    BaseCollection.meteorCollections[name] = new Meteor.Collection(name);
                }
                else
                    BaseCollection.meteorCollections[name] = Meteor.users;
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
            mapper.MeteorPersistence.updatePersistencePaths(p);
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
                mapper.MeteorPersistence.updatePersistencePaths(object);
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
        BaseCollection.prototype.insert = function (p, callback) {
            if (Meteor.isServer) {
                if (typeof p.getId != "function" || !p.getId())
                    p.setId(new Mongo.ObjectID()._str);
                var doc = this.serializer.toDocument(p);
                doc.serial = 0;
                console.log("inserting document: ", doc);
                var that = this;
                function afterwards(e, id) {
                    if (!e) {
                        console.log("inserted into '" + that.getName() + "' new id:" + id);
                        if (typeof p.setId == "function")
                            p.setId(id);
                        else
                            throw new Error("Unable to set Id after an object of class '" + mapper.className(that.theClass) + "' was inserted into collection '" + that.name + "'. Either only call insert with objects that already have an ID or declare a 'setId' function on the class.");
                        mapper.MeteorPersistence.updatePersistencePaths(p);
                    }
                    else
                        console.log("error while inserting into " + this.name, e);
                    if (callback)
                        callback(e, id);
                }
                try {
                    var id = this.meteorCollection.insert(doc, callback ? afterwards : undefined);
                    if (!callback)
                        afterwards(undefined, id);
                    else
                        return id;
                }
                catch (e) {
                    if (!callback)
                        afterwards(e);
                }
                return id;
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
    mapper.BaseCollection = BaseCollection;
})(mapper || (mapper = {}));
mapper.MeteorPersistence.wrapFunction(mapper.BaseCollection, "resetAll", "resetAll", true, null, new mapper.ConstantObjectRetriever(mapper.BaseCollection));
//# sourceMappingURL=BaseCollection.js.map