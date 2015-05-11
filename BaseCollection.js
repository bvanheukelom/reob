///<reference path="references.d.ts"/>
var MeteorPersistence = require("./MeteorPersistence");
var Serializer = require("./Serializer");
var PersistenceAnnotation = require("./PersistenceAnnotation");
var BaseCollection = (function () {
    function BaseCollection(persistableClass) {
        MeteorPersistence.init();
        var collectionName = PersistenceAnnotation.getCollectionName(persistableClass);
        if (!MeteorPersistence.collections[collectionName]) {
            MeteorPersistence.collections[collectionName] = this;
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
        var p = Serializer.toObject(doc, this.theClass);
        MeteorPersistence.updatePersistencePaths(p);
        return p;
    };
    BaseCollection.prototype.update = function (id, updateFunction) {
        for (var i = 0; i < 10; i++) {
            var document = this.meteorCollection.findOne({
                _id: id
            });
            if (!document)
                return undefined;
            var currentSerial = document.serial;
            var object = this.documentToObject(document);
            updateFunction(object);
            MeteorPersistence.updatePersistencePaths(object);
            var documentToSave = Serializer.toDocument(object);
            documentToSave.serial = currentSerial + 1;
            console.log("writing document ", documentToSave);
            var updatedDocumentCount = this.meteorCollection.update({
                _id: id,
                serial: currentSerial
            }, documentToSave);
            if (updatedDocumentCount == 1) {
                return object;
            }
            else if (updatedDocumentCount > 1)
                throw new Meteor.Error("verifiedUpdate should only update one document");
            else {
                console.log("rerunning verified update ");
            }
        }
        return undefined;
    };
    BaseCollection.prototype.insert = function (p) {
        if (!p.getId || !p.getId())
            throw new Error("Object has no Id");
        var doc = Serializer.toDocument(p);
        doc._id = p.getId();
        doc.serial = 0;
        console.log("inserting document: ", doc);
        this.meteorCollection.insert(doc);
        MeteorPersistence.updatePersistencePaths(p);
    };
    BaseCollection.meteorCollections = {};
    return BaseCollection;
})();
module.exports = BaseCollection;
//# sourceMappingURL=BaseCollection.js.map