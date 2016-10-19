

import * as reob from "./reob"

import {Request} from "./Request"
import {EventListenerRegistry} from "./EventListenerRegistry"

import * as mongodb from "mongodb"
import * as Promise from "bluebird"
import * as uuid from "node-uuid"

function getDefaultCollectionName(t:reob.TypeClass<any>):string {
    return reob.Reflect.getClassName(t);
}

class EventNames{
    static onBeforeSave:string = "onBeforeSave";
    static onBeforeRemove:string = "onBeforeSave";
    static onAfterRemove:string = "onAfterRemove";
    static onBeforeInsert:string = "onBeforeInsert";
    static onAfterInsert:string = "onAfterInsert";
    static onBeforeUpdate:string = "onBeforeUpdate";
    static onAfterUpdate:string = "onAfterUpdate";
    static onDuringUpdate:string = "onDuringUpdate";
}

interface CapturedEvent{
    topic:string;
    subTopic:string;
    data:any;
}


export class Collection<T extends reob.OmmObject> implements reob.Handler
{
    private mongoCollection:mongodb.Collection;
    private theClass:reob.TypeClass<T>;
    private name:string;
    private serializer:reob.Serializer;

    private eventListenerRegistry:EventListenerRegistry<reob.EventListener<T>> = new EventListenerRegistry<reob.EventListener<T>>();

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
    onBeforeRemove( f:reob.EventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onBeforeRemove, f );
    }

    /**
     * Adds an event listener that is called after an object is removed from the collection.
     * @param f the listener
     */
    onAfterRemove(f:reob.EventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onAfterRemove, f );
    }

    /**
     * Adds an event listener that is called after an object is inserted into the collection. The listener can cancel the operation.
     * @param f the listener
     */
    onBeforeInsert(f:reob.EventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onBeforeInsert, f );
    }

    /**
     * Adds an event listener that is called after an object is inserted into the collection.
     * @param f the listener
     */
    onAfterInsert(f:reob.EventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onAfterInsert, f );
    }

    /**
     * Adds an event listener that is called before a collection is updated with an updated object.
     * @param f the listener
     */
    onBeforeSave( f?:reob.EventListener<T> ){
        this.eventListenerRegistry.on( EventNames.onBeforeSave, f );
    }

    /**
     * Adds an event listener that is called before a remote function updates an object. The listener can cancel the operation.
     * @param f the listener
     */
    onBeforeUpdate( cls?:reob.TypeClass<any>|reob.EventListener<T>, functionName?:string, f?:reob.EventListener<T> ){
        this.registerEventListener( EventNames.onBeforeUpdate, cls, functionName, f );
    }

    /**
     * Adds an event listener that is called after a remote function updates an object.
     * @param f the listener
     */
    onAfterUpdate( cls?:reob.TypeClass<any>|reob.EventListener<T>, functionName?:string, f?:reob.EventListener<T> ){
        this.registerEventListener( EventNames.onAfterUpdate, cls, functionName, f );
    }

    private registerEventListener( topic:string, cls:reob.TypeClass<reob.OmmObject>|reob.EventListener<T>, functionName?:string, f?:reob.EventListener<T> ){
        var subTopic = undefined;
        if( typeof cls === "function" ){
            f = <reob.EventListener<T>>cls;
        } else if( cls && functionName ){
            subTopic = reob.Reflect.getClassName(<reob.TypeClass<reob.OmmObject>>cls)+"."+functionName;
        } else {
            throw new Error( "Illegal combination of parameters." );
        }
        this.eventListenerRegistry.on( topic, subTopic,  f );
    }


    onDuringUpdate<O extends Object>( topic:string|reob.EventListener<T>,  f?:reob.EventListener<T> ):void {
        if( typeof topic == "function" ){
            f = <reob.EventListener<any>>topic;
        }
        this.eventListenerRegistry.on( <string>EventNames.onDuringUpdate, topic, f );
    }

    private sendEventsCollectedDuringUpdate( preUpdateObject, postUpdateObject, rootObject, functionName:string, serializationPath:reob.SerializationPath, events:Array<any> ):Promise<void>{
        var ctx = new reob.EventContext( postUpdateObject, this );
        var objectContext = reob.SerializationPath.getObjectContext(postUpdateObject);
        ctx.preUpdate = preUpdateObject;
        ctx.functionName = functionName;
        ctx.serializationPath = serializationPath;
        ctx.request = objectContext.request;
        ctx.rootObject = rootObject;
        var entityClass = reob.Reflect.getClass(postUpdateObject);

        var promises = [];

        events.forEach(function(t:CapturedEvent){
            if( reob.isVerbose() )console.log( 'emitting event: '+t  );
            promises.push( this.eventListenerRegistry.emit( t.topic, t.subTopic, t.data))
        });
        return Promise.all(promises).thenReturn();
    }


    // private emit( topic:string, data:any ){
    //     if( this.queue )
    //         this.queue.push({topic:topic, data:data});
    // }
    //
    private emitLater( t:string, evtCtx:reob.EventContext<T>, data?:any ):Promise<void>{
        if( reob.isVerbose() )console.log("Emitting "+t);
        return this.eventListenerRegistry.emit( t, undefined, data ).then(()=>{
            if( evtCtx.cancelledWithError() )
                throw evtCtx.cancelledWithError() ;
        });
    }
    //
    // private flushQueue(){
    //     if( this.queue ){
    //         this.queue.forEach(function(evt:any){
    //             this.emitNow(evt.topic, evt.data);
    //         });
    //         this.queue = undefined;
    //     }
    // }
    //
    // private resetQueue(){
    //     this.queue = [];
    // }

    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */


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
            debugger;
            throw new Error("No Mongo Collection set. Use 'setMongoCollection' first." );
        }
        return this.mongoCollection;
    }


    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    getById(id:string, session?:Request):Promise<T>
    {
        return this.find({
            "_id": id
        }, session ).then((values:[T])=>{
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
    protected find( findCriteria:any, session?:Request ):Promise<Array<T>>
    {
        return this.cursorToObjects( this.getMongoCollection().find(findCriteria ), session );
    }

    cursorToObjects( c:any, session?:Request ):Promise<Array<T>>{
        var cursor:mongodb.Cursor = c;
        return cursor.toArray().then((documents:Array<reob.Document>)=>{
            var objects:Array<T> = [];
            for (var i = 0; i < documents.length; i++) {
                var document:reob.Document = documents[i];
                objects[i] = this.serializer.toObject(document, this, this.getEntityClass(), new reob.SerializationPath(this.getName(), document._id), session);
            }
            return objects;

        });
    }

    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    getAll( userData?:any ):Promise<Array<T>>
    {
        return this.find({}, userData);
    }

    getByIdOrFail(id:string, userData?:any):Promise<T>{
        return this.getById( id, userData ).then((t:T)=>{
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

        var ctx = new reob.EventContext( undefined, this );
        ctx.objectId = id;
        return this.emitLater( "willRemove", ctx ).then(()=>{
            if( reob.isVerbose() )console.log("removing");
            return this.getMongoCollection().remove({_id:id }).then((result)=>{
                if( reob.isVerbose() )console.log("removing2");
                var c2 = new reob.EventContext(undefined, this);
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

    getByIds(ids:Array<string>, userData?:any):Promise<{[index:string]:T}>{
        return this.find({
            _id: {$in: ids}
        }).then((objs)=>{
            var result:any = {};
            objs.forEach((o:T)=>{
                result[reob.getId(o)] = o;
            });
            return result;
        } );
    }


    private updateOnce(sp:reob.SerializationPath, updateFunction:(o:T)=>void, attempt:number, session:Request, functionName?:string ):Promise<CollectionUpdateResult> {
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

        var resultPromise = Promise.all([objectPromise,rootObjectPromise]).then( (values:any)=>{
            var object  = values[0];
            var rootObject = values[1];
            // call the update function
            var result:CollectionUpdateResult = { };

            result.events = [];
            reob.setEmitHandler(( topic:string, data:any )=>{
                result.events.push({topic:EventNames.onDuringUpdate, subTopic:topic, data:data});
            });
            // This is where the update function is called
            result.result = updateFunction(object);
            result.object = object;

            // maybe there are new objects in the tree that starts with root object. those need the context.
            reob.SerializationPath.setObjectContext(rootObject, new reob.SerializationPath(this.getName(), reob.getId(rootObject)), this, session);
            reob.SerializationPath.updateObjectContexts(rootObject, this, session);
            return result;
        });
        
        var updatePromise = Promise.all([objectPromise, currentSerialPromise, resultPromise, rootObjectPromise]).then((values:any)=>{
            var object = values[0];
            var currentSerial:number = values[1];
            var result:CollectionUpdateResult = values[2];
            var rootObject = values[3];
            var ctx = new reob.EventContext( rootObject, this );
            return this.eventListenerRegistry.emit( EventNames.onBeforeSave, undefined, ctx ).then(()=> {

                var documentToSave:reob.Document = this.serializer.toDocument(rootObject);
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
                return Promise.reject(new Error("Reob updated more than 1 document. This is not expected."));
            } else if( attempt<10 ) {
                return this.updateOnce(sp, updateFunction, attempt+1, session, functionName );
                //if( omm.verbose )console.log("rerunning verified update ");
                // we need to do this again
            } else {
                return Promise.reject( new Error("Reob tried 10 times to update the document. This happens if there is a lot of concurrency.") );
            }
        }).then((r:CollectionUpdateResult)=>{
            if( reob.isVerbose() )console.log("Events collected during updating ", r.events, "session:",session );
            return this.sendEventsCollectedDuringUpdate( r.object, r.object, r.rootObject,functionName, sp, r.events ).then(()=> {
                var ctx = new reob.EventContext<T>(<any>r.rootObject, this); // this is being emitted on the collection level so it needs to look as if the object was updated is the root element
                ctx.functionName = functionName;
                ctx.serializationPath = sp;
                ctx.rootObject = r.rootObject;
                ctx.request = session;
                ctx.preUpdateDocument = r.rootDocumentPre;
                ctx.postUpdateDocument = r.rootDocumentPost;

                return this.emitLater( EventNames.onAfterUpdate , ctx).thenReturn(r.result);
            });
        });
    }

    /**
     * Performs an update on an object in the collection. After the update the object is attempted to be saved to
     * the collection. If the object has changed between the time it was loaded and the time it is saved, the whole
     * process is repeated. This means that the updateFunction might be called more than once.
     * @param id - the id of the object
     * @param updateFunction - the function that alters the loaded object
     */
    update( sp:reob.SerializationPath, updateFunction:(o:T)=>void, session?:Request, functionName?:string ):Promise<any>
    {
        if (!sp || !updateFunction)
            return Promise.reject( new Error( "update function or serialiationPath parameter missing" ) );

        return this.updateOnce( sp, updateFunction,0, session, functionName ).then((cru:CollectionUpdateResult)=>{
            return cru.result;
        });
    }
    
    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {reob.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert( p:T, session?:Request ):Promise<string> {

        var ctx = new reob.EventContext(p, this);
        ctx.request = session;
        return this.emitLater( "willInsert", ctx ).then(()=>{
            //if( omm.verbose )console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = reob.Reflect.getIdPropertyName(this.theClass);
            var id = p[idPropertyName];
            if (!id){
                p[idPropertyName] = uuid.v1();//new mongodb.ObjectID().toString();
                id = p[idPropertyName];
            }
            var doc:reob.Document = this.serializer.toDocument(p);

            doc.serial = 0;
            //if( omm.verbose )console.log( "inserting document: ", doc);

            return this.getMongoCollection().insertOne(doc).then(()=>{
                reob.SerializationPath.setObjectContext(p, new reob.SerializationPath(this.getName(), id), this, session);
                reob.SerializationPath.updateObjectContexts(p, this, session);

                //if( omm.verbose )console.log("didInsert");
                var ctx2 =  new reob.EventContext( p, this);
                ctx2.request = session;
                return this.emitLater("didInsert", ctx2).thenReturn(id);
            });
        });
    }

    getEntityClass():reob.TypeClass<T>{
        return this.theClass;
    }

    // the handler function for the collection updates of objects loaded via this collection
    protected updating:boolean = false;
    
    collectionUpdate(entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[], session:Request ):any{
        if( this.updating ){
            if( reob.isVerbose() )console.log("Skipping collection update '"+reob.Reflect.getClassName(entityClass)+"."+functionName+"' . Collection update already in progress. Calling original function.");
            return originalFunction.apply(object, args);
        }


        if( reob.isVerbose() )console.log( 'Doing a collection upate in the collection for '+functionName );

        var rootObject;
        var objectPromise:Promise<any>;

        var rootObjectPromise:Promise<any>;

        var objectContext = reob.SerializationPath.getObjectContext(object);
        var sp = objectContext.serializationPath;

        rootObjectPromise =  this.getById(sp.getId());
        objectPromise = rootObjectPromise.then((rootObject:any)=>{
            return sp.getSubObject(rootObject);
        });

        return Promise.all([objectPromise,rootObjectPromise]).then((values:any[])=>{
            var object:any = values[0];
            var rootObject:any = values[1];

            // create the event context
            var ctx = new reob.EventContext( object, this );
            ctx.functionName = functionName;
            ctx.serializationPath = sp;
            ctx.rootObject = rootObject;
            ctx.request = objectContext.request;
            return this.emitLater( EventNames.onBeforeUpdate, ctx ).then(()=>{
                return this.update( sp,  (subObject) => {
                    this.updating = true;
                    try{
                        var r2 = originalFunction.apply(subObject, args);
                        return r2;
                    }finally{
                        this.updating = false;
                    }
                }).then((r:CollectionUpdateResult)=>{
                    return r.result;
                });

            })
        });
    }

}

interface CollectionUpdateResult{
    result?:any; // what the update function has returned
    events?:Array<CapturedEvent>; // the events emitted with omm.emit during the update that went through
    object?:reob.OmmObject; // the updated object
    rootObject?:reob.OmmObject; // the root object
    rootDocumentPre?:reob.Document;
    rootDocumentPost?:reob.Document;
}
//
// function callEventListeners<O extends Object>( t:reob.TypeClass<O>, topic:string, ctx:reob.EventContext<any>, data?:any ):Promise<void>{
//     var className = reob.Reflect.getClassName(t);
//     ctx.topic = topic;
//     var promises = [];
//     if( className && reob.eventListeners[className] && reob.eventListeners[className][topic] ){
//         reob.eventListeners[className][topic].forEach( function(el:reob.EventListener<any>){
//             try {
//                 var p = Promise.cast( el(ctx, data) );
//                 promises.push( p );
//             }catch( e ){
//                 console.error("Exception in event listener for class '"+className+"' and topic '"+topic+"':", e);
//             }
//         });
//     }
//
//     if( topic.indexOf("pre:")!=0 && topic!="pre" && topic.indexOf("post:")!=0 && topic!="post" && className && reob.eventListeners[className] && reob.eventListeners[className]["_all"] ) {
//         reob.eventListeners[className]["_all"].forEach(function (el:reob.EventListener<any>) {
//             try{
//                 var p = Promise.cast( el(ctx, data) );
//                 promises.push( p );
//             }catch( e ){
//                 console.error("Exception in event listener for class '"+className+"' and _all topic:", e);
//             }
//         });
//     }
//     return Promise.all(promises).thenReturn().catch((reason)=>{
//         console.error('Error in callEventListeners',reason);
//     });
// }