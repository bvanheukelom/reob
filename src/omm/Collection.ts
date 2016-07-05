

import * as omm from "../omm"

import * as omm_sp from "./SerializationPath"
import Serializer from "../serializer/Serializer"
import Document from "../serializer/Document"
import {TypeClass as TypeClass } from "../annotations/PersistenceAnnotation"
import * as omm_event from "../event/OmmEvent"
import Status from "./Status"
import * as Config from "./Config"
import * as mongodb from "mongodb"

export default class Collection<T extends Object>
{
    private mongoCollection:mongodb.Collection;
    private theClass:omm.TypeClass<T>;
    private name:string;
    private serializer:Serializer;
    private eventListeners:{ [index:string]:Array< ( i:omm.EventContext<T>, data?:any )=>void > } = {};
    private db:mongodb.Db;
    private static meteorCollections:{[index:string]:any} = { };

    private static collections:{[index:string]:Collection<any>} = {};

    private queue:Array<any>;

    removeAllListeners():void{
        this.eventListeners = {};
    }

    static getByName( s:string ){
        return Collection.collections[s];
    }

    preSave( f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        this.addListener("preSave", f);
    }

    onRemove( f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        this.addListener("didRemove", f);
    }
    preRemove( f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        this.addListener("willRemove", f);
    }
    onInsert( f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        this.addListener("didInsert", f);
    }
    preInsert( f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        this.addListener("willInsert", f);
    }

    private addListener( topic:string, f:( evtCtx:omm.EventContext<T>, data:any )=>void ){
        if( !this.eventListeners[topic] )
            this.eventListeners[topic] = [];
        this.eventListeners[topic].push(f);
    }

    emit( topic:string, data:any ){
        if( this.queue )
            this.queue.push({topic:topic, data:data});
    }

    private emitNow( t:string, evtCtx:omm.EventContext<T>, data?:any ){
        if( this.eventListeners[t] ) {
            this.eventListeners[t].forEach(function (listener:Function) {
                listener(evtCtx, data);
            });
        }
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
    constructor(  entityClass:omm.TypeClass<T>, collectionName?:string ) {
        this.serializer = new Serializer();
        //var collectionName = omm.PersistenceAnnotation.getCollectionName(persistableClass);
        if( !collectionName )
            collectionName = omm.getDefaultCollectionName(entityClass);
        omm.addCollectionRoot(entityClass, collectionName);
        this.name = collectionName;

        if( !Collection.getByName( collectionName ) ) {
            // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
            Collection.collections[collectionName] = this;
        }

        this.mongoCollection = omm.MeteorPersistence.db.collection( this.name );
        this.theClass = entityClass;
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
    getName():string {
        return this.name;
    }

    /**
     * Returns the underlying mongo collection.
     * @returns {any}
     */
    getMeteorCollection( ):any
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
            return values.length?values[0]:undefined;
        });

    }

    /**
     * Finds objects based on a selector.
     * @param {object} findCriteria the mongo selector
     * @returns {Array<T>}
     * @protected
     */
    protected find(findCriteria:any):Promise<Array<T>>
    {
        return this.mongoCollection.find(findCriteria).toArray().then((documents:Array<Document>)=>{
            var objects:Array<T> = [];
            for (var i = 0; i < documents.length; i++) {
                var document:Document = documents[i];
                objects[i] = this.documentToObject(document);
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

    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    protected remove( id:string ):Promise<any>
    {
        var ctx = new omm.EventContext( undefined, this );
        ctx.objectId = id;
        ctx.methodContext = Status.methodContext;
        this.emitNow( "willRemove", ctx );
        if( ctx.cancelledWithError() ) {
            return Promise.reject(ctx.cancelledWithError());
        }else if (!id) {
            return Promise.reject("Trying to remove an object that does not have an id.");
        }else{
            return this.mongoCollection.remove({_id:id }).then((result)=>{
                var c2 = new omm.EventContext(undefined, this);
                c2.objectId = id;
                c2.methodContext = Status.methodContext;
                this.emitNow("didRemove", c2 );
                return result;
            });
        }
    }

    protected documentToObject( doc:Document ):T
    {
        var p:T = this.serializer.toObject<T>(doc, this.theClass);
        omm_sp.SerializationPath.updateSerializationPaths(p);
        return p;
    }


    private updateOnce(id:string, updateFunction:(o:T)=>void, attempt:number):Promise<any> {
        var valuePromise = this.mongoCollection.find({
            _id: id
        }).toArray().then((documents:Document[])=> {
            var document = documents[0];
            if (!document) {
                return Promise.reject("No document found for id: " + id);
            }

            var currentSerial = document.serial;

            omm_event.resetQueue();
            // call the update function
            var object:T = this.documentToObject(document);
            var result = updateFunction(object);

            omm_sp.SerializationPath.updateSerializationPaths(object);
            return {currentSerial:currentSerial, object:object, result:result};
        });
        var updatePromise = valuePromise.then((data:{currentSerial:number, object:any, result:any})=>{

            var ctx = new omm.EventContext(data.object, this);
            omm_event.callEventListeners(this.getEntityClass(), "preSave", ctx);

            var documentToSave:Document = this.serializer.toDocument(data.object);
            documentToSave.serial = (data.currentSerial || 0) + 1;

            // update the collection
            //console.log("writing document ", documentToSave);

            return this.mongoCollection.updateOne({
                _id: id,
                serial: data.currentSerial
            }, documentToSave);
        });
        return Promise.all([valuePromise, updatePromise]).then( (values:any[]) => {

            var data:{currentSerial:number, object:any, result:any} = values[0];
            var updateResult:any = values[1];
            // verify that that went well
            if (updateResult.modifiedCount == 1) {
                // return result; // we're done

                return Promise.resolve(data.result);
            }
            else if (updateResult.modifiedCount > 1) {
                return Promise.reject("verifiedUpdate should only update one document");
            } else if( attempt<10 ) {
                return this.updateOnce(id, updateFunction, attempt+1 );
                //console.log("rerunning verified update ");
                // we need to do this again
            } else {
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
    update(id:string, updateFunction:(o:T)=>void):Promise<any>
    {
        if (!id || !updateFunction)
            return Promise.reject("parameter missing");

        return this.updateOnce(id, updateFunction,0);
    }


    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert( p:T ):Promise<String>
    {

        var ctx = new omm.EventContext(p, this);
        ctx.methodContext = Status.methodContext;
        this.emitNow("willInsert", ctx);
        //console.log("inserting 2n");
        if( ctx.cancelledWithError() ){
            return new Promise<String>((resolve,reject)=>{
                reject(ctx.cancelledWithError())
            });
        } else {
            //console.log("insert not cancelled");
            // TODO make sure that this is unique
            var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(this.theClass);
            var id = p[idPropertyName];
            if (!id){
                p[idPropertyName] = new mongodb.ObjectID().toString();
                id = p[idPropertyName];
            }
            var doc:Document = this.serializer.toDocument(p);

            doc.serial = 0;
            //console.log( "inserting document: ", doc);

            return this.mongoCollection.insert(doc).then(()=>{
                omm_sp.SerializationPath.updateSerializationPaths(p);

                //console.log("didInsert");
                var ctx2 =  new omm.EventContext( p, this);
                ctx2.methodContext = Status.methodContext;
                this.emitNow("didInsert", ctx2);
                return id;
            });
        }
    }

    /**
     * called once the objects are removed or an error happens
     * @callback omm.Collection~resetAllCallback
     * @param error {any=} if an error occured it is passed to the callback
     */


    getEntityClass():TypeClass<T>{
        return this.theClass;
    }
}



