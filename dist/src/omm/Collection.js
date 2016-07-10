"use strict";
var omm = require("../omm");
var omm_sp = require("./SerializationPath");
var omm_event = require("../event/OmmEvent");
var mongodb = require("mongodb");
var Promise = require("bluebird");
var Collection = (function () {
    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */
    function Collection(db, entityClass, collectionName) {
        this.eventListeners = {};
        this.serializer = new omm.Serializer();
        if (!collectionName)
            collectionName = omm.getDefaultCollectionName(entityClass);
        // this might have to go away
        omm.addCollectionRoot(entityClass, collectionName);
        this.name = collectionName;
        this.mongoCollection = db.collection(this.name);
        this.theClass = entityClass;
    }
    Collection.prototype.removeAllListeners = function () {
        this.eventListeners = {};
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
    Collection.prototype.preUpdate = function (f) {
        this.addListener("willUpdate", f);
    };
    Collection.prototype.onUpdate = function (f) {
        this.addListener("didUpdate", f);
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
    Collection.prototype.emitLater = function (t, evtCtx, data) {
        console.log("emitting " + t);
        var promises = [];
        if (this.eventListeners[t]) {
            this.eventListeners[t].forEach(function (listener) {
                promises.push(Promise.cast(listener(evtCtx, data)));
            });
        }
        return Promise.all(promises).then(function () {
            if (evtCtx.cancelledWithError())
                return Promise.reject(evtCtx.cancelledWithError());
            else
                return;
        });
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
    // private static _getMeteorCollection( name?:string ) {
    //     if( !Collection.meteorCollections[name] ) {
    //         Collection.meteorCollections[name] = (Config.getMongo()).;
    //     }
    //     return Collection.meteorCollections[name];
    // }
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
    Collection.prototype.getMongoCollection = function () {
        return this.mongoCollection;
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
            if (values.length)
                return values[0];
            else
                return undefined;
        });
    };
    /**
     * Finds objects based on a selector.
     * @param {object} findCriteria the mongo selector
     * @returns {Array<T>}
     * @protected
     */
    Collection.prototype.find = function (findCriteria) {
        return this.cursorToObjects(this.mongoCollection.find(findCriteria));
    };
    Collection.prototype.cursorToObjects = function (c) {
        var _this = this;
        var cursor = c;
        return cursor.toArray().then(function (documents) {
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
    Collection.prototype.getByIdOrFail = function (id) {
        return this.getById(id).then(function (t) {
            if (!t)
                return Promise.reject("Not found");
            else
                return t;
        });
    };
    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    Collection.prototype.remove = function (id) {
        var _this = this;
        if (!id)
            return Promise.reject("Trying to remove an object that does not have an id.");
        var ctx = new omm.EventContext(undefined, this);
        ctx.objectId = id;
        return this.emitLater("willRemove", ctx).then(function () {
            console.log("removing");
            debugger;
            return _this.mongoCollection.remove({ _id: id }).then(function (result) {
                console.log("removing2");
                var c2 = new omm.EventContext(undefined, _this);
                c2.objectId = id;
                return _this.emitLater("didRemove", c2).thenReturn(result);
            });
        });
    };
    Collection.prototype.documentToObject = function (doc) {
        var p = this.serializer.toObject(doc, this.theClass, this);
        return p;
    };
    Collection.prototype.sendEventsCollectedDuringUpdate = function (preUpdateObject, postUpdateObject, rootObject, functionName, serializationPath, events, userData) {
        var ctx = new omm.EventContext(postUpdateObject, this);
        ctx.preUpdate = preUpdateObject;
        ctx.functionName = functionName;
        ctx.serializationPath = serializationPath;
        ctx.userData = userData;
        ctx.rootObject = rootObject;
        //ctx.ob
        var entityClass = omm.PersistenceAnnotation.getClass(postUpdateObject);
        events.forEach(function (t) {
            //console.log( 'emitting event:'+t.topic );
            omm_event.callEventListeners(entityClass, t.topic, ctx, t.data);
        });
        omm_event.callEventListeners(entityClass, "post:" + functionName, ctx);
        omm_event.callEventListeners(entityClass, "post", ctx);
    };
    Collection.prototype.updateOnce = function (sp, updateFunction, attempt) {
        var _this = this;
        var documentPromise = this.mongoCollection.find({
            _id: sp.getId()
        }).toArray().then(function (documents) {
            var document = documents[0];
            if (!document) {
                return Promise.reject("No document found for id: " + sp.getId());
            }
            return document;
        });
        var currentSerialPromise = documentPromise.then(function (doc) {
            return doc.serial;
        });
        var rootObjectPromise = documentPromise.then(function (doc) {
            return _this.documentToObject(doc);
        });
        var objectPromise = rootObjectPromise.then(function (rootObject) {
            return sp.getSubObject(rootObject);
        });
        var resultPromise = objectPromise.then(function (object) {
            omm_event.resetQueue();
            // call the update function
            var result = {};
            result.result = updateFunction(object);
            result.events = omm_event.getQueue();
            result.object = object;
            omm_event.resetQueue();
            omm_sp.SerializationPath.updateObjectContexts(object, _this);
            return result;
        });
        var updatePromise = Promise.all([objectPromise, currentSerialPromise, resultPromise, rootObjectPromise]).then(function (values) {
            var object = values[0];
            var currentSerial = values[1];
            var result = values[2];
            var rootObject = values[3];
            var ctx = new omm.EventContext(rootObject, _this);
            ctx.functionName;
            omm_event.callEventListeners(_this.getEntityClass(), "preSave", ctx);
            var documentToSave = _this.serializer.toDocument(rootObject);
            documentToSave.serial = (currentSerial || 0) + 1;
            // update the collection
            //console.log("writing document ", documentToSave);
            return _this.mongoCollection.updateOne({
                _id: omm.getId(rootObject),
                serial: currentSerial
            }, documentToSave);
        });
        return Promise.all([resultPromise, updatePromise, rootObjectPromise]).then(function (values) {
            var result = values[0];
            var updateResult = values[1];
            var rootObject = values[2];
            // verify that that went well
            if (updateResult.modifiedCount == 1) {
                var cr = {
                    events: result.events,
                    rootObject: rootObject,
                    object: result.object,
                    result: result.result
                };
                return cr;
            }
            else if (updateResult.modifiedCount > 1) {
                return Promise.reject("verifiedUpdate should only update one document");
            }
            else if (attempt < 10) {
                return _this.updateOnce(sp, updateFunction, attempt + 1);
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
    Collection.prototype.update = function (sp, updateFunction) {
        if (!sp || !updateFunction)
            return Promise.reject("parameter missing");
        return this.updateOnce(sp, updateFunction, 0);
    };
    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    Collection.prototype.insert = function (p) {
        var _this = this;
        var ctx = new omm.EventContext(p, this);
        var ud = omm.Server.userData;
        ctx.userData = ud;
        return this.emitLater("willInsert", ctx).then(function () {
            //console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(_this.theClass);
            var id = p[idPropertyName];
            if (!id) {
                p[idPropertyName] = new mongodb.ObjectID().toString();
                id = p[idPropertyName];
            }
            var doc = _this.serializer.toDocument(p);
            doc.serial = 0;
            //console.log( "inserting document: ", doc);
            return _this.mongoCollection.insert(doc).then(function () {
                omm_sp.SerializationPath.updateObjectContexts(p, _this);
                //console.log("didInsert");
                var ctx2 = new omm.EventContext(p, _this);
                ctx2.userData = ud;
                return _this.emitLater("didInsert", ctx2).thenReturn(id);
            });
        });
    };
    Collection.prototype.getEntityClass = function () {
        return this.theClass;
    };
    // the handler function for the collection updates of objects loaded via this collection
    Collection.prototype.collectionUpdate = function (entityClass, functionName, object, originalFunction, args) {
        var _this = this;
        console.log('doing a collection upate in the collection for ' + functionName);
        var rootObject;
        var objectPromise;
        var rootObjectPromise;
        var objectContext = omm.SerializationPath.getObjectContext(object);
        var sp = objectContext.serializationPath;
        rootObjectPromise = this.getById(sp.getId());
        objectPromise = rootObjectPromise.then(function (rootObject) {
            return sp.getSubObject(rootObject);
        });
        var ud = omm.Server.userData;
        return Promise.all([objectPromise, rootObjectPromise]).then(function (values) {
            var object = values[0];
            var rootObject = values[1];
            // create the event context
            var ctx = new omm.EventContext(object, _this);
            ctx.functionName = functionName;
            ctx.serializationPath = sp;
            ctx.rootObject = rootObject;
            ctx.userData = ud;
            return _this.emitLater("willUpdate", ctx).then(function () {
                var preUpdateObject = object;
                if (ctx.cancelledWithError()) {
                    return Promise.reject(ctx.cancelledWithError());
                }
                else {
                    var resultPromise = _this.update(sp, function (subObject) {
                        var r2 = originalFunction.apply(subObject, args);
                        return r2;
                    }).then(function (r) {
                        console.log("Events collected during updating ", r.events);
                        _this.sendEventsCollectedDuringUpdate(r.object, r.object, r.rootObject, functionName, sp, r.events, ud);
                        var ctx = new omm.EventContext(r.object, _this);
                        ctx.functionName = functionName;
                        ctx.serializationPath = sp;
                        ctx.rootObject = r.rootObject;
                        ctx.userData = ud;
                        return _this.emitLater("didUpdate", ctx).thenReturn(r.result);
                    });
                    return resultPromise;
                }
            });
        });
    };
    return Collection;
}());
exports.Collection = Collection;
//# sourceMappingURL=Collection.js.map