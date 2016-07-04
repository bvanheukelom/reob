"use strict";
var omm = require("../annotations/PersistenceAnnotation");
var omm_sp = require("./SerializationPath");
var Serializer_1 = require("../serializer/Serializer");
var omm_event = require("../event/OmmEvent");
var Status_1 = require("./Status");
var Config = require("./Config");
var Collection = (function () {
    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */
    function Collection(entityClass, collectionName) {
        this.eventListeners = {};
        this.serializer = new Serializer_1.default();
        //var collectionName = omm.PersistenceAnnotation.getCollectionName(persistableClass);
        if (!collectionName)
            collectionName = omm.getDefaultCollectionName(entityClass);
        omm.addCollectionRoot(entityClass, collectionName);
        this.name = collectionName;
        if (!Collection.getByName(collectionName)) {
            // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
            Collection.collections[collectionName] = this;
        }
        this.meteorCollection = Collection._getMeteorCollection(collectionName);
        this.theClass = entityClass;
    }
    Collection.prototype.removeAllListeners = function () {
        this.eventListeners = {};
    };
    Collection.getByName = function (s) {
        return Collection.collections[s];
    };
    Collection.prototype.preSave = function (f) {
        this.addListener("preSave", f);
    };
    Collection.prototype.onRemove = function (f) {
        this.addListener("didRemove", f);
    };
    Collection.prototype.preRemove = function (f) {
        this.addListener("willRemove", f);
    };
    Collection.prototype.onInsert = function (f) {
        this.addListener("didInsert", f);
    };
    Collection.prototype.preInsert = function (f) {
        this.addListener("willInsert", f);
    };
    Collection.prototype.addListener = function (topic, f) {
        if (!this.eventListeners[topic])
            this.eventListeners[topic] = [];
        this.eventListeners[topic].push(f);
    };
    Collection.prototype.emit = function (topic, data) {
        if (this.queue)
            this.queue.push({ topic: topic, data: data });
    };
    Collection.prototype.emitNow = function (t, evtCtx, data) {
        if (this.eventListeners[t]) {
            this.eventListeners[t].forEach(function (listener) {
                listener(evtCtx, data);
            });
        }
    };
    Collection.prototype.flushQueue = function () {
        if (this.queue) {
            this.queue.forEach(function (evt) {
                this.emitNow(evt.topic, evt.data);
            });
            this.queue = undefined;
        }
    };
    Collection.prototype.resetQueue = function () {
        this.queue = [];
    };
    Collection._getMeteorCollection = function (name) {
        if (!Collection.meteorCollections[name]) {
            Collection.meteorCollections[name] = (Config.getMongo()).collection(name);
        }
        return Collection.meteorCollections[name];
    };
    /**
     * Gets the name of the collection.
     * @returns {string}
     */
    Collection.prototype.getName = function () {
        return this.name;
    };
    /**
     * Returns the underlying mongo collection.
     * @returns {any}
     */
    Collection.prototype.getMeteorCollection = function () {
        return this.meteorCollection;
    };
    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    Collection.prototype.getById = function (id) {
        return this.find({
            "_id": id
        }).then(function (values) {
            return values.length ? values[0] : undefined;
        });
    };
    /**
     * Finds objects based on a selector.
     * @param {object} findCriteria the mongo selector
     * @returns {Array<T>}
     * @protected
     */
    Collection.prototype.find = function (findCriteria) {
        var _this = this;
        return this.meteorCollection.find(findCriteria).toArray().then(function (documents) {
            var objects = [];
            for (var i = 0; i < documents.length; i++) {
                var document = documents[i];
                objects[i] = _this.documentToObject(document);
            }
            return objects;
        });
    };
    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    Collection.prototype.getAll = function () {
        return this.find({});
    };
    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    Collection.prototype.remove = function (id) {
        var _this = this;
        var ctx = new omm.EventContext(undefined, this);
        ctx.objectId = id;
        ctx.methodContext = Status_1.default.methodContext;
        this.emitNow("willRemove", ctx);
        if (ctx.cancelledWithError()) {
            return Promise.reject(ctx.cancelledWithError());
        }
        else if (!id) {
            return Promise.reject("Trying to remove an object that does not have an id.");
        }
        else {
            return this.meteorCollection.remove({ _id: id }).then(function (result) {
                var c2 = new omm.EventContext(undefined, _this);
                c2.objectId = id;
                c2.methodContext = Status_1.default.methodContext;
                _this.emitNow("didRemove", c2);
                return result;
            });
        }
    };
    Collection.prototype.documentToObject = function (doc) {
        var p = this.serializer.toObject(doc, this.theClass);
        omm_sp.SerializationPath.updateSerializationPaths(p);
        return p;
    };
    Collection.prototype.updateOnce = function (id, updateFunction, attempt) {
        var _this = this;
        var valuePromise = this.meteorCollection.find({
            _id: id
        }).toArray().then(function (documents) {
            var document = documents[0];
            if (!document) {
                return Promise.reject("No document found for id: " + id);
            }
            var currentSerial = document.serial;
            omm_event.resetQueue();
            // call the update function
            var object = _this.documentToObject(document);
            var result = updateFunction(object);
            omm_sp.SerializationPath.updateSerializationPaths(object);
            return { currentSerial: currentSerial, object: object, result: result };
        });
        var updatePromise = valuePromise.then(function (data) {
            var ctx = new omm.EventContext(data.object, _this);
            omm_event.callEventListeners(_this.getEntityClass(), "preSave", ctx);
            var documentToSave = _this.serializer.toDocument(data.object);
            documentToSave.serial = (data.currentSerial || 0) + 1;
            // update the collection
            //console.log("writing document ", documentToSave);
            return _this.meteorCollection.updateOne({
                _id: id,
                serial: data.currentSerial
            }, documentToSave);
        });
        return Promise.all([valuePromise, updatePromise]).then(function (values) {
            var data = values[0];
            var updateResult = values[1];
            // verify that that went well
            if (updateResult.modifiedCount == 1) {
                // return result; // we're done
                return Promise.resolve(data.result);
            }
            else if (updateResult.modifiedCount > 1) {
                return Promise.reject("verifiedUpdate should only update one document");
            }
            else if (attempt < 10) {
                return _this.updateOnce(id, updateFunction, attempt + 1);
            }
            else {
                return Promise.reject("tried 10 times to update the document");
            }
        });
    };
    /**
     * Performs an update on an object in the collection. After the update the object is attempted to be saved to
     * the collection. If the object has changed between the time it was loaded and the time it is saved, the whole
     * process is repeated. This means that the updateFunction might be called more than once.
     * @param id - the id of the object
     * @param updateFunction - the function that alters the loaded object
     */
    Collection.prototype.update = function (id, updateFunction) {
        if (!id || !updateFunction)
            return Promise.reject("parameter missing");
        return this.updateOnce(id, updateFunction, 0);
    };
    /**
     * callback is called once the object got inserted or an error happened
     * @callback omm.Collection~insertCallback
     * @param e {any} error
     * @param id {id=} string
     */
    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    Collection.prototype.insert = function (p) {
        var _this = this;
        var ctx = new omm.EventContext(p, this);
        ctx.methodContext = Status_1.default.methodContext;
        this.emitNow("willInsert", ctx);
        //console.log("inserting 2n");
        if (ctx.cancelledWithError()) {
            return new Promise(function (resolve, reject) {
                reject(ctx.cancelledWithError());
            });
        }
        else {
            //console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(this.theClass);
            var id = p[idPropertyName];
            if (!id) {
                p[idPropertyName] = new (Config.getMongo().ObjectID)().toString();
                id = p[idPropertyName];
            }
            var doc = this.serializer.toDocument(p);
            doc.serial = 0;
            //console.log( "inserting document: ", doc);
            return this.meteorCollection.insert(doc).then(function () {
                omm_sp.SerializationPath.updateSerializationPaths(p);
                //console.log("didInsert");
                var ctx2 = new omm.EventContext(p, _this);
                ctx2.methodContext = Status_1.default.methodContext;
                _this.emitNow("didInsert", ctx2);
                return id;
            });
        }
    };
    /**
     * called once the objects are removed or an error happens
     * @callback omm.Collection~resetAllCallback
     * @param error {any=} if an error occured it is passed to the callback
     */
    ///**
    // * removes all objects (for testing purposes)
    // * @param {omm.Collection~resetAllCallback} cb called when it's done
    // */
    //@omm.StaticMeteorMethod({replaceWithCall:true, parameterTypes:['callback']})
    //static resetAll( cb:(error?:any)=>void ){
    //    var arr:Array<any> = [];
    //    for( var i in Collection.meteorCollections )
    //        arr.push(Collection.meteorCollections[i]);
    //    if( arr.length>0 ){
    //        for( var j in arr )
    //        {
    //            if( parseInt(j)!=arr.length-1)
    //                Config.getMeteor().wrapAsync(function(cb2){
    //                    arr[j].remove({},cb2);
    //                })();
    //            else {
    //                arr[j].remove({}, cb);
    //            }
    //        }
    //    }
    //    else
    //        cb();
    //
    //}
    Collection.prototype.getEntityClass = function () {
        return this.theClass;
    };
    Collection.meteorCollections = {};
    Collection.collections = {};
    return Collection;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Collection;
//# sourceMappingURL=Collection.js.map