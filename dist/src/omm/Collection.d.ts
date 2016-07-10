import * as omm from "../omm";
import Document from "../serializer/Document";
import { TypeClass as TypeClass } from "../annotations/PersistenceAnnotation";
export declare class Collection<T extends Object> implements omm.Handler {
    private mongoCollection;
    private theClass;
    private name;
    private serializer;
    private eventListeners;
    private queue;
    removeAllListeners(): void;
    preSave(f: (evtCtx: omm.EventContext<T>, data: any) => void): void;
    onRemove(f: (evtCtx: omm.EventContext<T>, data: any) => void): void;
    preRemove(f: (evtCtx: omm.EventContext<T>, data: any) => void): void;
    onInsert(f: (evtCtx: omm.EventContext<T>, data: any) => void): void;
    preInsert(f: (evtCtx: omm.EventContext<T>, data: any) => void): void;
    private addListener(topic, f);
    emit(topic: string, data: any): void;
    private emitNow(t, evtCtx, data?);
    private flushQueue();
    private resetQueue();
    /**
     * Represents a Mongo collection that contains entities.
     * @param c {function} The constructor function of the entity class.
     * @param collectionName {string=} The name of the collection
     * @class
     * @memberof omm
     */
    constructor(db: any, entityClass: omm.TypeClass<T>, collectionName?: string);
    /**
     * Gets the name of the collection.
     * @returns {string}
     */
    getName(): string;
    /**
     * Returns the underlying mongo collection.
     * @returns {any}
     */
    getMongoCollection(): any;
    /**
     * Loads an object from the collection by its id.
     * @param id {string} the id
     * @returns {T} the object or undefined if it wasn't found
     */
    getById(id: string): Promise<T>;
    /**
     * Finds objects based on a selector.
     * @param {object} findCriteria the mongo selector
     * @returns {Array<T>}
     * @protected
     */
    protected find(findCriteria: any): Promise<Array<T>>;
    cursorToObjects(c: any): Promise<Array<T>>;
    /**
     * Gets all objects in a collection.
     * @returns {Array<T>}
     */
    getAll(): Promise<Array<T>>;
    getByIdOrFail(id: string): Promise<T>;
    /**
     * Removes an entry from a collection
     * @param id {string} the id of the object to be removed from the collection
     * @callback cb the callback that's called once the object is removed or an error happend
     */
    protected remove(id: string): Promise<any>;
    protected documentToObject(doc: Document): T;
    sendEventsCollectedDuringUpdate(preUpdateObject: any, postUpdateObject: any, rootObject: any, functionName: string, serializationPath: omm.SerializationPath, events: Array<any>): void;
    private updateOnce(sp, updateFunction, attempt);
    /**
     * Performs an update on an object in the collection. After the update the object is attempted to be saved to
     * the collection. If the object has changed between the time it was loaded and the time it is saved, the whole
     * process is repeated. This means that the updateFunction might be called more than once.
     * @param id - the id of the object
     * @param updateFunction - the function that alters the loaded object
     */
    update(sp: omm.SerializationPath, updateFunction: (o: T) => void): Promise<CollectionUpdateResult>;
    /**
     * Inserts an object into the collection
     * @param p the object
     * @param {omm.Collection~insertCallback} callback
     * @returns {string} the id of the new object
     */
    insert(p: T): Promise<String>;
    getEntityClass(): TypeClass<T>;
    collectionUpdate(entityClass: omm.TypeClass<any>, functionName: string, object: omm.OmmObject, originalFunction: Function, args: any[]): any;
}
export interface CollectionUpdateResult {
    result: any;
    events: Array<any>;
    object: any;
    rootObject: any;
}
