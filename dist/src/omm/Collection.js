"use strict";
const omm = require("../omm");
const omm_sp = require("./SerializationPath");
const omm_event = require("../event/OmmEvent");
const mongodb = require("mongodb");
class Collection {
    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */
    constructor(db, entityClass, collectionName) {
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
    removeAllListeners() {
        this.eventListeners = {};
    }
    preSave(f) {
        this.addListener("preSave", f);
    }
    onRemove(f) {
        this.addListener("didRemove", f);
    }
    preRemove(f) {
        this.addListener("willRemove", f);
    }
    onInsert(f) {
        this.addListener("didInsert", f);
    }
    preUpdate(f) {
        this.addListener("willUpdate", f);
    }
    onUpdate(f) {
        this.addListener("didUpdate", f);
    }
    preInsert(f) {
        this.addListener("willInsert", f);
    }
    addListener(topic, f) {
        if (!this.eventListeners[topic])
            this.eventListeners[topic] = [];
        this.eventListeners[topic].push(f);
    }
    emit(topic, data) {
        if (this.queue)
            this.queue.push({ topic: topic, data: data });
    }
    emitNow(t, evtCtx, data) {
        if (this.eventListeners[t]) {
            this.eventListeners[t].forEach(function (listener) {
                try {
                    listener(evtCtx, data);
                }
                catch (e) {
                    console.log("Exception when emitting event! Topic:" + t, "Context:", evtCtx, "Data:", data);
                    console.log(e);
                }
            });
        }
    }
    flushQueue() {
        if (this.queue) {
            this.queue.forEach(function (evt) {
                this.emitNow(evt.topic, evt.data);
            });
            this.queue = undefined;
        }
    }
    resetQueue() {
        this.queue = [];
    }
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
    getName() {
        return this.name;
    }
    /**
     * Returns the underlying mongo collection.
     * @returns {any}
     */
    getMongoCollection() {
        return this.mongoCollection;
    }
    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    getById(id) {
        return this.find({
            "_id": id
        }).then((values) => {
            if (values.length)
                return values[0];
            else
                return undefined;
        });
    }
    /**
     * Finds objects based on a selector.
     * @param {object} findCriteria the mongo selector
     * @returns {Array<T>}
     * @protected
     */
    find(findCriteria) {
        return this.cursorToObjects(this.mongoCollection.find(findCriteria));
    }
    cursorToObjects(c) {
        var cursor = c;
        return cursor.toArray().then((documents) => {
            var objects = [];
            for (var i = 0; i < documents.length; i++) {
                var document = documents[i];
                objects[i] = this.documentToObject(document);
            }
            return objects;
        });
    }
    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    getAll() {
        return this.find({});
    }
    getByIdOrFail(id) {
        return this.getById(id).then((t) => {
            if (!t)
                return Promise.reject("Not found");
            else
                return t;
        });
    }
    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    remove(id) {
        var ctx = new omm.EventContext(undefined, this);
        ctx.objectId = id;
        this.emitNow("willRemove", ctx);
        if (ctx.cancelledWithError()) {
            return Promise.reject(ctx.cancelledWithError());
        }
        else if (!id) {
            return Promise.reject("Trying to remove an object that does not have an id.");
        }
        else {
            return this.mongoCollection.remove({ _id: id }).then((result) => {
                var c2 = new omm.EventContext(undefined, this);
                c2.objectId = id;
                this.emitNow("didRemove", c2);
                return result;
            });
        }
    }
    documentToObject(doc) {
        var p = this.serializer.toObject(doc, this.theClass, this);
        return p;
    }
    sendEventsCollectedDuringUpdate(preUpdateObject, postUpdateObject, rootObject, functionName, serializationPath, events, userData) {
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
    }
    updateOnce(sp, updateFunction, attempt) {
        var documentPromise = this.mongoCollection.find({
            _id: sp.getId()
        }).toArray().then((documents) => {
            var document = documents[0];
            if (!document) {
                return Promise.reject("No document found for id: " + sp.getId());
            }
            return document;
        });
        var currentSerialPromise = documentPromise.then((doc) => {
            return doc.serial;
        });
        var rootObjectPromise = documentPromise.then((doc) => {
            return this.documentToObject(doc);
        });
        var objectPromise = rootObjectPromise.then((rootObject) => {
            return sp.getSubObject(rootObject);
        });
        var resultPromise = objectPromise.then((object) => {
            omm_event.resetQueue();
            // call the update function
            var result = {};
            result.result = updateFunction(object);
            result.events = omm_event.getQueue();
            result.object = object;
            omm_event.resetQueue();
            omm_sp.SerializationPath.updateObjectContexts(object, this);
            return result;
        });
        var updatePromise = Promise.all([objectPromise, currentSerialPromise, resultPromise, rootObjectPromise]).then((values) => {
            var object = values[0];
            var currentSerial = values[1];
            var result = values[2];
            var rootObject = values[3];
            var ctx = new omm.EventContext(rootObject, this);
            ctx.functionName;
            omm_event.callEventListeners(this.getEntityClass(), "preSave", ctx);
            var documentToSave = this.serializer.toDocument(rootObject);
            documentToSave.serial = (currentSerial || 0) + 1;
            // update the collection
            //console.log("writing document ", documentToSave);
            return this.mongoCollection.updateOne({
                _id: omm.getId(rootObject),
                serial: currentSerial
            }, documentToSave);
        });
        return Promise.all([resultPromise, updatePromise, rootObjectPromise]).then((values) => {
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
                return this.updateOnce(sp, updateFunction, attempt + 1);
            }
            else {
                return Promise.reject("tried 10 times to update the document");
            }
        });
    }
    /**
     * Performs an update on an object in the collection. After the update the object is attempted to be saved to
     * the collection. If the object has changed between the time it was loaded and the time it is saved, the whole
     * process is repeated. This means that the updateFunction might be called more than once.
     * @param id - the id of the object
     * @param updateFunction - the function that alters the loaded object
     */
    update(sp, updateFunction) {
        if (!sp || !updateFunction)
            return Promise.reject("parameter missing");
        return this.updateOnce(sp, updateFunction, 0);
    }
    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert(p) {
        var ctx = new omm.EventContext(p, this);
        var ud = omm.Server.userData;
        ctx.userData = ud;
        this.emitNow("willInsert", ctx);
        //console.log("inserting 2n");
        if (ctx.cancelledWithError()) {
            return new Promise((resolve, reject) => {
                reject(ctx.cancelledWithError());
            });
        }
        else {
            //console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(this.theClass);
            var id = p[idPropertyName];
            if (!id) {
                p[idPropertyName] = new mongodb.ObjectID().toString();
                id = p[idPropertyName];
            }
            var doc = this.serializer.toDocument(p);
            doc.serial = 0;
            //console.log( "inserting document: ", doc);
            return this.mongoCollection.insert(doc).then(() => {
                omm_sp.SerializationPath.updateObjectContexts(p, this);
                //console.log("didInsert");
                var ctx2 = new omm.EventContext(p, this);
                ctx2.userData = ud;
                this.emitNow("didInsert", ctx2);
                return id;
            });
        }
    }
    getEntityClass() {
        return this.theClass;
    }
    // the handler function for the collection updates of objects loaded via this collection
    collectionUpdate(entityClass, functionName, object, originalFunction, args) {
        console.log('doing a collection upate in the collection for ' + functionName);
        var rootObject;
        var objectPromise;
        var rootObjectPromise;
        var objectContext = omm.SerializationPath.getObjectContext(object);
        var sp = objectContext.serializationPath;
        rootObjectPromise = this.getById(sp.getId());
        objectPromise = rootObjectPromise.then((rootObject) => {
            return sp.getSubObject(rootObject);
        });
        var ud = omm.Server.userData;
        return Promise.all([objectPromise, rootObjectPromise]).then((values) => {
            var object = values[0];
            var rootObject = values[1];
            // create the event context
            var ctx = new omm.EventContext(object, this);
            ctx.functionName = functionName;
            ctx.serializationPath = sp;
            ctx.rootObject = rootObject;
            ctx.userData = ud;
            this.emitNow("willUpdate", ctx);
            var preUpdateObject = object;
            if (ctx.cancelledWithError()) {
                return Promise.reject(ctx.cancelledWithError());
            }
            else {
                var resultPromise = this.update(sp, function (subObject) {
                    var r2 = originalFunction.apply(subObject, args);
                    return r2;
                }).then((r) => {
                    console.log("Events collected during updating ", r.events);
                    this.sendEventsCollectedDuringUpdate(r.object, r.object, r.rootObject, functionName, sp, r.events, ud);
                    var ctx = new omm.EventContext(r.object, this);
                    ctx.functionName = functionName;
                    ctx.serializationPath = sp;
                    ctx.rootObject = r.rootObject;
                    ctx.userData = ud;
                    this.emitNow("didUpdate", ctx);
                    return r.result;
                });
                return resultPromise;
            }
        });
    }
}
exports.Collection = Collection;
//# sourceMappingURL=Collection.js.map