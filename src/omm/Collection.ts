

import * as omm from "../omm"

import * as omm_sp from "./SerializationPath"

import Document from "../serializer/Document"
import {TypeClass as TypeClass } from "../annotations/PersistenceAnnotation"
import * as omm_event from "../event/OmmEvent"
import * as Config from "./Config"
import * as mongodb from "mongodb"
import * as Promise from "bluebird"

import * as uuid from "node-uuid"


export class Collection<T extends Object> implements omm.Handler
{
    private mongoCollection:mongodb.Collection;
    private theClass:omm.TypeClass<T>;
    private name:string;
    private serializer:omm.Serializer;
    private eventListeners:{ [index:string]:Array<omm.EventListener<T>> } = {};


    private queue:Array<any>;

    removeAllListeners():void{
        this.eventListeners = {};
    }

    preSave( f:omm.EventListener<T> ){
        this.addListener("preSave", f);
    }

    onRemove( f:omm.EventListener<T> ){
        this.addListener("didRemove", f);
    }
    preRemove( f:omm.EventListener<T> ){
        this.addListener("willRemove", f);
    }
    onInsert( f:omm.EventListener<T> ){
        this.addListener("didInsert", f);
    }
    preUpdate( f:omm.EventListener<T> ){
        this.addListener("willUpdate", f);
    }
    onUpdate( f:omm.EventListener<T> ){
        this.addListener("didUpdate", f);
    }
    preInsert( f:omm.EventListener<T> ){
        this.addListener("willInsert", f);
    }

    private addListener( topic:string, f:omm.EventListener<T> ){
        if( !this.eventListeners[topic] )
            this.eventListeners[topic] = [];
        this.eventListeners[topic].push(f);
    }

    emit( topic:string, data:any ){
        if( this.queue )
            this.queue.push({topic:topic, data:data});
    }

    private emitLater( t:string, evtCtx:omm.EventContext<T>, data?:any ):Promise<void>{
        console.log("emitting "+t);
        var promises = [];
        if( this.eventListeners[t] ) {
            this.eventListeners[t].forEach(function (listener:Function) {
                promises.push( Promise.cast( listener(evtCtx, data) ) );
            });
        }
        return Promise.all(promises).then(()=>{
            if( evtCtx.cancelledWithError() )
                return Promise.reject(evtCtx.cancelledWithError());
            else
                return;
        });
    }

    private flushQueue(){
        if( this.queue ){
            this.queue.forEach(function(evt:any){
                this.emitNow(evt.topic, evt.data);
            });
            this.queue = undefined;
        }
    }

    private resetQueue(){
        this.queue = [];
    }

    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */
    constructor( db:any, entityClass:omm.TypeClass<T>, collectionName?:string ) {
        this.serializer = new omm.Serializer();
        if( !collectionName )
            collectionName = omm.getDefaultCollectionName(entityClass);

        // this might have to go away
        // omm.addCollectionRoot(entityClass, collectionName);

        this.name = collectionName;

        this.mongoCollection = db.collection( this.name );
        this.theClass = entityClass;
    }


    /**
     * Gets the name of the collection.
     * @returns {string}
     */
    getName():string {
        return this.name;
    }

    /**
     * Returns the underlying mongo collection.
     * @returns {any}
     */
    getMongoCollection( ):any
    {
        return this.mongoCollection;
    }

    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    getById(id:string):Promise<T>
    {
        return this.find({
            "_id": id
        }).then((values:[T])=>{
            if( values.length )
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
    protected find(findCriteria:any ):Promise<Array<T>>
    {
        return this.cursorToObjects( this.mongoCollection.find(findCriteria ) );
    }

    cursorToObjects( c:any ):Promise<Array<T>>{
        var cursor:mongodb.Cursor = c;
        return cursor.toArray().then((documents:Array<Document>)=>{
            var objects:Array<T> = [];
            for (var i = 0; i < documents.length; i++) {
                var document:Document = documents[i];
                objects[i] = this.serializer.toObject(document, this, this.getEntityClass(), new omm.SerializationPath(this.getName(), document._id));
            }
            return objects;

        });
    }

    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    getAll():Promise<Array<T>>
    {
        return this.find({});
    }

    getByIdOrFail(id:string):Promise<T>{
        return this.getById(id).then((t:T)=>{
            if( !t )
                return Promise.reject(new Error("Not found"));
            else
                return t;
        });
    }

    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    protected remove( id:string ):Promise<any>
    {
        if (!id)
            return Promise.reject(new Error("Trying to remove an object that does not have an id."));

        var ctx = new omm.EventContext( undefined, this );
        ctx.objectId = id;
        return this.emitLater( "willRemove", ctx ).then(()=>{
            console.log("removing");
            debugger;
            return this.mongoCollection.remove({_id:id }).then((result)=>{
                console.log("removing2");
                var c2 = new omm.EventContext(undefined, this);
                c2.objectId = id;
                return this.emitLater( "didRemove", c2 ).thenReturn(true);
            }) ;
        });
    }

    // protected documentToObject( doc:Document ):T
    // {
    //     var p:any = this.serializer.toObject(doc, this, this.theClass );
    //
    //     return p;
    // }

    getByIds(ids:Array<string>):Promise<{[index:string]:T}>{
        return this.find({
            _id: {$in: ids}
        }).then((objs)=>{
            var result:any = {};
            objs.forEach((o:T)=>{
                result[omm.getId(o)] = o;
            });
            return result;
        } );
    }

    sendEventsCollectedDuringUpdate( preUpdateObject, postUpdateObject, rootObject, functionName:string, serializationPath:omm.SerializationPath, events:Array<any>, userData:any ):Promise<void>{
        var ctx = new omm.EventContext( postUpdateObject, this );
        ctx.preUpdate = preUpdateObject;
        ctx.functionName = functionName;
        ctx.serializationPath = serializationPath;
        ctx.userData = userData;
        ctx.rootObject = rootObject;
        //ctx.ob

        var entityClass = omm.PersistenceAnnotation.getClass(postUpdateObject);

        var promises = [];
        events.forEach(function(t){
            console.log( 'emitting event:'+t.topic, ' on class '+omm.className(entityClass) );
            var p = omm_event.callEventListeners( entityClass, t.topic, ctx, t.data );
            promises.push( p );
        });

        promises.push( omm_event.callEventListeners( entityClass, "post:"+functionName, ctx ) );
        promises.push( omm_event.callEventListeners( entityClass, "post", ctx ) );
        return Promise.all(promises).thenReturn();
    }

    private updateOnce(sp:omm.SerializationPath, updateFunction:(o:T)=>void, attempt:number):Promise<CollectionUpdateResult> {
        var documentPromise = this.mongoCollection.find({
            _id: sp.getId()
        }).toArray().then((documents:Document[])=> {
            var document = documents[0];
            if (!document) {
                return Promise.reject(new Error("No document found for id: " + sp.getId()));
            }
            return document;
        });
        var currentSerialPromise = documentPromise.then((doc)=>{
            return doc.serial;
        });

        var rootObjectPromise = documentPromise.then((doc)=>{
            // do not user a handler. If the original function is called, there shouldn't be any more collection updates
            // happening
            return this.serializer.toObject(doc, undefined, this.getEntityClass());
        });
        var objectPromise = rootObjectPromise.then((rootObject)=>{
            return sp.getSubObject(rootObject);
        });

        var resultPromise = objectPromise.then( (object:any)=>{
            omm_event.resetQueue();
            // call the update function
            var result:any = {};
            
            // This is where the update function is called
            result.result = updateFunction(object);
            
            // handle events sent during the update
            result.events = omm_event.getQueue();
            result.object = object;
            omm_event.resetQueue();
            omm_sp.SerializationPath.updateObjectContexts(object, this);
            return result;
        });
        
        var updatePromise = Promise.all([objectPromise, currentSerialPromise, resultPromise, rootObjectPromise]).then((values:any)=>{
            var object = values[0];
            var currentSerial:number = values[1];
            var result = values[2];
            var rootObject = values[3];
            var ctx = new omm.EventContext( rootObject, this);
            omm_event.callEventListeners(this.getEntityClass(), "preSave", ctx);

            var documentToSave:Document = this.serializer.toDocument(rootObject);
            documentToSave.serial = (currentSerial || 0) + 1;

            // update the collection
            // console.log("writing document ", documentToSave);

            return this.mongoCollection.updateOne({
                _id: omm.getId(rootObject),
                serial: currentSerial
            }, documentToSave).then((updateResult)=>{
                updateResult['documentToSave'] = documentToSave;
                return updateResult;
            });
        });

        return Promise.all([resultPromise, updatePromise, rootObjectPromise, documentPromise]).then( (values:any[]) => {
            var result= values[0];
            var updateResult:any = values[1];
            var rootObject:any = values[2];
            var documentPre:any = values[3];
            // verify that that went well
            if (updateResult.modifiedCount == 1) {
                var cr:CollectionUpdateResult = {
                    events : result.events,
                    rootObject: rootObject,
                    object : result.object,
                    result : result.result,
                    rootDocumentPre: documentPre,
                    rootDocumentPost: updateResult.documentToSave
                };
                return cr;
            }
            else if (updateResult.modifiedCount > 1) {
                return Promise.reject(new Error("verifiedUpdate should only update one document"));
            } else if( attempt<10 ) {
                return this.updateOnce(sp, updateFunction, attempt+1 );
                //console.log("rerunning verified update ");
                // we need to do this again
            } else {
                debugger;
                return Promise.reject( new Error("tried 10 times to update the document"));
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
    update(sp:omm.SerializationPath, updateFunction:(o:T)=>void):Promise<CollectionUpdateResult>
    {
        if (!sp || !updateFunction)
            return Promise.reject(new Error( "update function or serialiationPath parameter missing" ));

        return this.updateOnce(sp, updateFunction,0);
    }


    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert( p:T ):Promise<string> {

        var ctx = new omm.EventContext(p, this);
        var ud = omm.Server.userData;
        ctx.userData = ud;
        return this.emitLater( "willInsert", ctx ).then(()=>{
            //console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(this.theClass);
            var id = p[idPropertyName];
            if (!id){
                p[idPropertyName] = uuid.v1();//new mongodb.ObjectID().toString();
                id = p[idPropertyName];
            }
            var doc:Document = this.serializer.toDocument(p);

            doc.serial = 0;
            //console.log( "inserting document: ", doc);

            return this.mongoCollection.insertOne(doc).then(()=>{
                omm_sp.SerializationPath.setObjectContext(p, new omm.SerializationPath(this.getName(), id), this);
                omm_sp.SerializationPath.updateObjectContexts(p, this);

                //console.log("didInsert");
                var ctx2 =  new omm.EventContext( p, this);
                ctx2.userData = ud;
                return this.emitLater("didInsert", ctx2).thenReturn(id);
            });
        });
    }

    getEntityClass():TypeClass<T>{
        return this.theClass;
    }

    // the handler function for the collection updates of objects loaded via this collection
    protected updating:boolean = false;
    
    collectionUpdate(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any{
        if( this.updating ){
            console.log("Skipping collection update '"+omm.className(entityClass)+"."+functionName+"' . Collection update already in progress. Calling original function.");
            return originalFunction.apply(object, args);
        }


        console.log( 'Doing a collection upate in the collection for '+functionName, 'userData:', omm.Server.userData );

        var rootObject;
        var objectPromise:Promise<any>;

        var rootObjectPromise:Promise<any>;

        var objectContext = omm.SerializationPath.getObjectContext(object);
        var sp = objectContext.serializationPath;

        rootObjectPromise =  this.getById(sp.getId());
        objectPromise = rootObjectPromise.then((rootObject:any)=>{
            return sp.getSubObject(rootObject);
        });
        var ud = omm.Server.userData;

        return Promise.all([objectPromise,rootObjectPromise]).then((values:any[])=>{
            var object:any = values[0];
            var rootObject:any = values[1];

            // create the event context
            var ctx = new omm.EventContext( object, this );
            ctx.functionName = functionName;
            ctx.serializationPath = sp;
            ctx.rootObject = rootObject;
            ctx.userData = ud;
            return this.emitLater( "willUpdate", ctx ).then(()=>{

                var preUpdateObject = object;

                if( ctx.cancelledWithError() ){
                    return Promise.reject(ctx.cancelledWithError());
                } else {
                    var resultPromise:Promise<CollectionUpdateResult> = this.update( sp,  (subObject) => {
                        this.updating = true;
                        try{
                            var r2 = originalFunction.apply(subObject, args);
                            return r2;
                        }finally{
                            this.updating = false;
                        }
                    }).then((r:CollectionUpdateResult)=>{
                        console.log("Events collected during updating ", r.events, "user data:",ud );
                        return this.sendEventsCollectedDuringUpdate( r.object, r.object, r.rootObject,functionName, sp, r.events, ud ).then(()=> {
                            var ctx = new omm.EventContext(r.object, this);
                            ctx.functionName = functionName;
                            ctx.serializationPath = sp;
                            ctx.rootObject = r.rootObject;
                            ctx.userData = ud;
                            ctx.preUpdateDocument = r.rootDocumentPre;
                            ctx.postUpdateDocument = r.rootDocumentPost;

                            return this.emitLater("didUpdate", ctx).thenReturn(r.result);
                        });
                    });

                    return resultPromise;
                }
            })
        });
    }

}
export interface CollectionUpdateResult{
    result:any; // what the update function has returned
    events:Array<any>; // the events emitted with omm.emit during the update that went through
    object:any; // the updated object
    rootObject:any; // the root object
    rootDocumentPre:any;
    rootDocumentPost:any;
}

