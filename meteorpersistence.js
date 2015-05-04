/**
 * Created by bert on 04.05.15.
 */
var PersistenceAnnotations = require("./PersistenceAnnotations");
var Serializer = require("./Serializer");
var PersistenceInfo = (function () {
    function PersistenceInfo() {
    }
    return PersistenceInfo;
})();
function init() {
    var allClasses = PersistenceAnnotations.getCollectionClasses();
    for (var i in allClasses) {
        var ctor = allClasses[i];
        PersistenceAnnotations.getSubDocumentPropertyNames(ctor);
    }
}
exports.init = init;
var BaseCollection = (function () {
    function BaseCollection(persistableClass) {
        this.toDocumentModifiers = [];
        var collectionName = Reflect.getMetadata("persist:collection", persistableClass);
        this.meteorCollection = new Meteor.Collection(collectionName);
        this.theClass = persistableClass;
    }
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
    BaseCollection.prototype.documentToObject = function (doc) {
        var p = Serializer.toObject(doc, this.theClass);
        //(<ModifiableObject><any>p).persistenceInfo = new PersistenceInfo();
        //(<ModifiableObject><any>p).persistenceInfo.path = new PersistencePath( this, p.getId() );
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
            // call the update function
            var object = this.documentToObject(document);
            updateFunction(object);
            var documentToSave = Serializer.toDocument(object);
            documentToSave.serial = currentSerial + 1;
            // update the collection
            console.log("writing document ", document);
            var updatedDocumentCount = this.meteorCollection.update({
                _id: id,
                serial: currentSerial
            }, document);
            // verify that that went well
            if (updatedDocumentCount == 1)
                return object; // we're done
            else if (updatedDocumentCount > 1)
                throw new Meteor.Error(500, "verifiedUpdate should only update one document");
            else {
                console.log("rerunning verified update ");
            }
        }
        return undefined;
    };
    BaseCollection.prototype.insert = function (p) {
        if (!p.getId())
            throw new Error("Object has no Id");
        var doc = Serializer.toDocument(p);
        doc.serial = 0;
        this.meteorCollection.insert(doc);
    };
    BaseCollection.isSaving = false;
    return BaseCollection;
})();
exports.BaseCollection = BaseCollection;
//# sourceMappingURL=MeteorPersistence.js.map