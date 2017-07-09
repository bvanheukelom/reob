

import * as reob from "./serverModule"
import * as mongodb from "mongodb"
import * as Promise from "bluebird"
import * as uuid from "uuid"

/**
 * @hidden
 */
function getDefaultCollectionName(t:reob.TypeClass<any>):string {
    return reob.Reflect.getClassName(t);
}
/**
 * @hidden
 */
class EventNames{

    static onBeforeRemove:string = "onBeforeRemove";
    static onAfterRemove:string = "onAfterRemove"; // only id

    static onBeforeInsert:string = "onBeforeInsert";
    static onAfterInsert:string = "onAfterInsert";

    static onBeforeUpdate:string = "onBeforeUpdate";
    static onAfterUpdate:string = "onAfterUpdate";
    static onBeforeSave:string = "onBeforeSave";
    static onDuringUpdate:string = "onDuringUpdate";

}

/**
 * @hidden
 */
interface CapturedEvent{
    topic:string;
    subTopic:string;
    data:any;
}


export interface RemoveEventListener {
    ( id:string, request?:reob.Request ) : Promise<void>|void
}

export interface UpdateEvent<T> {
    rootObject:T;
    subObject:any;
    functionName:string;
    args:any[];
    request:reob.Request;
    result:any;
    beforeUpdateDocument:reob.Document;
    afterUpdateDocument:reob.Document;
    data:any;
}

export interface UpdateEventListener<T> {
    ( updateEvent:UpdateEvent<T> ) : Promise<void>|void
}

export interface SaveEventListener<T> {
    ( object:T, request?:reob.Request ) : Promise<void>|void
}

export interface InsertEventListener<T> {
    ( object:T, request?:reob.Request ) : Promise<void>|void
}

export class Collection<T extends any> implements reob.Handler
{
    private mongoCollection:mongodb.Collection;
    private theClass:reob.TypeClass<T>;
    private name:string;
    private serializer:reob.Serializer;

    private eventListenerRegistry:reob.EventListenerRegistry = new reob.EventListenerRegistry();

    constructor( entityClass:reob.TypeClass<T>, collectionName?:string ) {
        this.serializer = new reob.Serializer();
        if( !collectionName )
            collectionName = getDefaultCollectionName(entityClass);

        this.name = collectionName;

        this.theClass = entityClass;
    }

    removeAllListeners():void{
        this.eventListenerRegistry.removeAllListeners();
    }

    /**
     * Adds an event listener that is called before an object is removed from the collection. The listener can cancel the operation.
     * @param f the listener
     */
    onBeforeRemove( f:RemoveEventListener ){
        this.eventListenerRegistry.on( EventNames.onBeforeRemove, undefined, f );
    }

    /**
     * Adds an event listener that is called after an object is removed from the collection.
     * @param f the listener
     */
    onAfterRemove( f:RemoveEventListener ){
        this.eventListenerRegistry.on( EventNames.onAfterRemove, undefined, f );
    }

    /**
     * Adds an event listener that is called after an object is inserted into the collection. The listener can cancel the operation.
     * @param f the listener
     */
    onBeforeInsert( f:InsertEventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onBeforeInsert, undefined, f );
    }

    /**
     * Adds an event listener that is called after an object is inserted into the collection.
     * @param f the listener
     */
    onAfterInsert( f:InsertEventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onAfterInsert, undefined, f );
    }

    /**
     * Adds an event listener that is called before a collection is updated with an updated object.
     * @param f the listener
     */
    onBeforeSave( f?:SaveEventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onBeforeSave, undefined, f );
    }

    /**
     * Adds an event listener that is called before a remote function updates an object. The listener can cancel the operation.
     * @param f the listener
     */
    onBeforeUpdate( cls?:reob.TypeClass<any>|UpdateEventListener<T>, functionName?:string, f?:UpdateEventListener<T> ){
        this.registerUpdateEventListener( EventNames.onBeforeUpdate, cls, functionName, f );
    }

    /**
     * Adds an event listener that is called after a remote function updates an object.
     * @param f the listener
     */
    onAfterUpdate( cls?:reob.TypeClass<any>|reob.UpdateEventListener<T>, functionName?:string, f?:UpdateEventListener<T> ){
        this.registerUpdateEventListener( EventNames.onAfterUpdate, cls, functionName, f );
    }

    private registerUpdateEventListener(topic:string, cls:reob.TypeClass<reob.Object>|UpdateEventListener<T>, functionName?:string, f?:UpdateEventListener<T> ){
        var subTopic = undefined;

        if( !f && typeof functionName === "undefined" && typeof cls === "function" ){
            f = <UpdateEventListener<T>>cls;
        } else if( typeof cls !== "undefined" && typeof functionName !== "undefined" && f && reob.Reflect.getClassName(<reob.TypeClass<reob.Object>>cls) ){
            if( reob.Reflect.getCollectionUpdateFunctionNames(<reob.TypeClass<reob.Object>>cls).indexOf(functionName)==-1 )
                throw new Error("'"+functionName+"' is not a collection updating function on the class/entity "+reob.Reflect.getClassName(<reob.TypeClass<reob.Object>>cls)+".");
            subTopic = reob.Reflect.getClassName(<reob.TypeClass<reob.Object>>cls)+"."+functionName;
        } else {
            throw new Error( "Illegal combination of parameters." );
        }
        this.eventListenerRegistry.on( topic, subTopic,  f );
    }

    /**
     * Adds an event listener that is called after an update is completed in case events were emitted using reob.emit(topic).
     * @param topic optional the event name that's emitted by reob.emit() in the update function
     * @param f the listener
     */
    onDuringUpdate<O extends Object>( topic:string|UpdateEventListener<T>,  f?:UpdateEventListener<T> ):void {
        if( typeof topic == "function" ){
            f = <UpdateEventListener<T>>topic;
            topic = undefined;
        }
        this.eventListenerRegistry.on( EventNames.onDuringUpdate, <string>topic, f );
    }

    private emit( t:string, subTopic:string, ...eventArgs:any[] ):Promise<void>{
        if( reob.isVerbose() )console.log("Emitting "+t);
        return this.eventListenerRegistry.emit( t, subTopic, eventArgs );
    }

    setMongoCollection( db:any ){
        // if( omm.isVerbose() )console.log("set mongo collection for collection ", this );
        this.mongoCollection = db.collection( this.name );
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
        if( !this.mongoCollection ){
            throw new Error("No Mongo Collection set. Use 'setMongoCollection' first." );
        }
        return this.mongoCollection;
    }


    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    getById(id:string, request?:reob.Request):Promise<T>
    {
        return this.find({
            "_id": id
        }, request ).then((values:[T])=>{
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
    protected find( findCriteria:any, request?:reob.Request ):Promise<Array<T>>
    {
        return this.cursorToObjects( this.getMongoCollection().find(findCriteria ), request );
    }

    cursorToObjects( c:any, request?:reob.Request ):Promise<Array<T>>{
        var cursor:mongodb.Cursor = c;
        return cursor.toArray().then((documents:Array<reob.Document>)=>{
            var objects:Array<T> = [];
            for (var i = 0; i < documents.length; i++) {
                var document:reob.Document = documents[i];
                objects[i] = this.serializer.toObject(document, this, this.getEntityClass(), new reob.SerializationPath(this.getName(), document._id), request);
            }
            return objects;

        });
    }

    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    getAll( request?:reob.Request ):Promise<Array<T>>
    {
        return this.find({}, request);
    }

    getByIdOrFail(id:string, request?:reob.Request):Promise<T>{
        return this.getById( id, request ).then((t:T)=>{
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
    remove( id:string, request?:reob.Request ):Promise<any> {
        if (!id)
            return Promise.reject(new Error("Trying to remove an object without an id."));

        return this.emit( EventNames.onBeforeRemove, undefined, id, request ).then(()=>{
            if( reob.isVerbose() )console.log("removing");
            return this.getMongoCollection().remove({_id:id }).then((result)=>{
                if( reob.isVerbose() )console.log("removing2");
                return this.emit( EventNames.onAfterRemove, undefined, id, request ).thenReturn(true);
            }) ;
        });
    }

    getByIds(ids:Array<string>, request?:reob.Request):Promise<{[index:string]:T}>{
        return this.find({
            _id: {$in: ids}
        }, request).then((objs)=>{
            var result:any = {};
            objs.forEach((o:T)=>{
                result[reob.getId(o)] = o;
            });
            return result;
        } );
    }

    /**
     * Performs an update on an object in the collection. After the update the object is attempted to be saved to
     * the collection. If the object has changed between the time it was loaded and the time it is saved, the whole
     * process is repeated. This means that the updateFunction might be called more than once.
     * @param id - the id of the object
     * @param updateFunction - the function that alters the loaded object
     */
    update( sp:reob.SerializationPath, updateFunction:(o:T)=>void, request?:reob.Request ):Promise<any> {
        if (!sp || !updateFunction)
            return Promise.reject( new Error( "update function or serialiationPath parameter missing" ) );

        return this.updateOnce( sp, updateFunction,0, request, undefined, false, undefined ).then((cru:CollectionUpdateResult<T>)=>{
            return cru.result;
        });
    }


    private updateOnce(sp:reob.SerializationPath, updateFunction:(o:T)=>void, attempt:number, request:reob.Request, functionName:string, didSendBeforeUpdateEvents:boolean, originalArguments:any[] ):Promise<CollectionUpdateResult<T>> {
        var documentPromise = this.getMongoCollection().find({
            _id: sp.getId()
        }).toArray().then((documents:reob.Document[])=> {
            var document:any = documents[0];
            if (!document) {
                return <any>Promise.reject(new Error("No document found for id: " + sp.getId()));
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

        var beforeUpdateEventSentPromise = Promise.all([rootObjectPromise, objectPromise, documentPromise]).then((values:any[])=> {
            var updateEvent: UpdateEvent<T> = {
                rootObject: values[0],
                subObject: values[1],
                functionName: functionName,
                args: originalArguments,
                result: undefined,
                request: request,
                beforeUpdateDocument: values[2],
                afterUpdateDocument: undefined,
                data:undefined
            };
            return this.emit( EventNames.onBeforeUpdate, undefined, updateEvent ).thenReturn();
        });

        var resultPromise = Promise.all([objectPromise,rootObjectPromise, beforeUpdateEventSentPromise]).then( (values:any)=>{
            var object  = values[0];
            var rootObject = values[1];
            // call the update function
            var result:CollectionUpdateResult<T> = { };

            result.events = [];
            reob.setEmitHandler(( topic:string, data:any )=>{
                result.events.push({topic:EventNames.onDuringUpdate, subTopic:topic, data:data});
            });
            // This is where the update function is called
            result.result = updateFunction(object);
            result.object = object;

            // maybe there are new objects in the tree that starts with root object. those need the context.
            reob.SerializationPath.setObjectContext(rootObject, new reob.SerializationPath(this.getName(), reob.getId(rootObject)), this, request);
            reob.SerializationPath.updateObjectContexts(rootObject, this, request);
            return result;
        });
        
        var updatePromise = Promise.all([objectPromise, currentSerialPromise, resultPromise, rootObjectPromise, documentPromise]).then((values:any)=>{
            var currentSerial:number = values[1];
            var rootObject = values[3];

            var documentToSave:reob.Document = this.serializer.toDocument(rootObject);

            return this.emit( EventNames.onBeforeSave, undefined, rootObject, request).then(()=> {

                documentToSave.serial = (currentSerial || 0) + 1;

                return this.getMongoCollection().updateOne({
                    _id: reob.getId(rootObject),
                    serial: currentSerial
                }, documentToSave).then((updateResult)=> {
                    updateResult['documentToSave'] = documentToSave;
                    return updateResult;
                });
            });
        });

        return Promise.all([resultPromise, updatePromise, rootObjectPromise, documentPromise]).then( (values:any[]) => {
            var result= values[0];
            var updateResult:any = values[1];
            var rootObject:any = values[2];
            var documentPre:any = values[3];
            // verify that that went well
            if (updateResult.modifiedCount == 1) {
                var cr:CollectionUpdateResult<T> = {
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
                return Promise.reject(new Error("Reob updated more than 1 document. This is not expected."));
            } else if( attempt<10 ) {
                return this.updateOnce(sp, updateFunction, attempt+1, request, functionName, true, originalArguments );
            } else {
                return Promise.reject( new Error("Reob tried 10 times to update the document. This happens if there is a lot of concurrency.") );
            }
        }).then((r:CollectionUpdateResult<T>)=>{
            if( reob.isVerbose() )console.log("Events collected during updating ", r.events, "request:",request );


            // send  'duringUpdate' events
            var promises = [];
            r.events.forEach((t:CapturedEvent)=>{
                var updateEvent:UpdateEvent<T> = {
                    rootObject:r.rootObject,
                    subObject:r.object,
                    functionName:functionName,
                    args:originalArguments,
                    result:r.result,
                    request:request,
                    beforeUpdateDocument:r.rootDocumentPre,
                    afterUpdateDocument:r.rootDocumentPost,
                    data:t.data
                };
                promises.push( Promise.cast( this.emit( t.topic, t.subTopic, updateEvent ) ));
            });
            // we ignore rejected promises from during and after events, we just want them to happen before this finishes.
            var duringSentPromise = Promise.all(promises).catch(()=>{}).then(()=>{
                if( reob.isVerbose() ) console.log("All 'during' events have been sent.")
            });

            // send  'afterUpdate' events
            var afterSentPromise = duringSentPromise.then(()=>{
                var updateEvent:UpdateEvent<T> = {
                    rootObject:r.rootObject,
                    subObject:r.object,
                    functionName:functionName,
                    args:originalArguments,
                    result:r.result,
                    request:request,
                    beforeUpdateDocument:r.rootDocumentPre,
                    afterUpdateDocument:r.rootDocumentPost,
                    data:undefined
                };
                return this.emit( EventNames.onAfterUpdate , undefined, updateEvent )
            }).catch(()=>{});
            return afterSentPromise.thenReturn(r);
        });
    }


    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {reob.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert( p:T, request?:reob.Request ):Promise<string> {
        // TODO make sure that this is unique
        var idPropertyName = reob.Reflect.getIdPropertyName(this.theClass);
        var id = p[idPropertyName];
        if (!id){
            p[idPropertyName] = uuid.v1();//new mongodb.ObjectID().toString();
            id = p[idPropertyName];
        }
        return this.emit( EventNames.onBeforeInsert, undefined, p, request ).then(()=>{
            //if( omm.verbose )console.log("insert not cancelled");

            var doc:reob.Document = this.serializer.toDocument(p);

            doc.serial = 0;
            //if( omm.verbose )console.log( "inserting document: ", doc);

            return this.getMongoCollection().insertOne(doc).then(()=>{
                reob.SerializationPath.setObjectContext(p, new reob.SerializationPath(this.getName(), id), this, request);
                reob.SerializationPath.updateObjectContexts(p, this, request);
                return this.emit(EventNames.onAfterInsert, undefined, p, request).thenReturn(id);
            });
        });
    }

    getEntityClass():reob.TypeClass<T>{
        return this.theClass;
    }

    // the handler function for the collection updates of objects loaded via this collection
    protected updating:boolean = false;
    
    collectionUpdate(entityClass:reob.TypeClass<any>, functionName:string, object:reob.Object, originalFunction:Function, args:any[], request:reob.Request ):any{
        if( this.updating ){
            if( reob.isVerbose() )console.log("Skipping collection update '"+reob.Reflect.getClassName(entityClass)+"."+functionName+"' . Collection update already in progress. Calling original function. ");
            return originalFunction.apply(object, args);
        }

        if( reob.isVerbose() )console.log( 'Doing a collection upate in the collection for '+reob.Reflect.getClassName(entityClass)+"."+functionName );

        // var rootObject;
        // var objectPromise:Promise<any>;
        //
        // var rootObjectPromise:Promise<any>;
        //
        //
        // rootObjectPromise =  this.getById(sp.getId(), request);
        // objectPromise = rootObjectPromise.then((rootObject:any)=>{
        //     return sp.getSubObject(rootObject);
        // });

        var objectContext = reob.SerializationPath.getObjectContext(object);
        var sp = objectContext.serializationPath;

        return this.updateOnce( sp, (subObject) => {
            this.updating = true;
            try{
                var r2 = originalFunction.apply(subObject, args);
                return r2;
            }finally{
                this.updating = false;
            }
        }, 0, request, functionName, false, args ).then((cru:CollectionUpdateResult<T>)=>{
            return cru.result;
        });


        // return Promise.all([objectPromise,rootObjectPromise]).then((values:any[])=>{
        // });
    }

}
/**
 * @hidden
 */
interface CollectionUpdateResult<T>{
    result?:any; // what the update function has returned
    events?:Array<CapturedEvent>; // the events emitted with omm.emit during the update that went through
    object?:reob.Object; // the updated object
    rootObject?:T; // the root object
    rootDocumentPre?:reob.Document;
    rootDocumentPost?:reob.Document;
}
