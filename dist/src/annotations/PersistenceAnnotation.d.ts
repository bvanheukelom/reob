export interface IMethodOptions {
    name?: string;
    parameterTypes?: Array<string>;
    parentObject?: any;
    resultType?: string;
    replaceWithCall?: boolean;
    serverOnly?: boolean;
}
/**
 * The omm module
 * @namespace omm
 */
export interface TypeClass<T> {
    new (): T;
}
export declare class EventContext<T> {
    private cancelledError;
    preUpdate: T;
    object: T;
    userData: any;
    objectId: string;
    collection: any;
    rootObject: any;
    functionName: string;
    serializationPath: any;
    topic: string;
    constructor(o: T, coll: any);
    cancel(err: any): void;
    cancelledWithError(): any;
}
export interface EventListener {
    (i: EventContext<any>, data?: any): void;
}
export declare function isRegisteredWithKey(o: any): string;
export declare var entityClasses: {
    [index: string]: TypeClass<Object>;
};
export declare var registeredObjects: {
    [index: string]: any;
};
export declare var eventListeners: {
    [index: string]: {
        [index: string]: Array<EventListener>;
    };
};
export declare var meteorMethodFunctions: Array<IMethodOptions>;
export declare function setNonEnumerableProperty(obj: Object, propertyName: string, value: any): void;
export declare function defineMetadata(propertyName: any, value: any, cls: any): void;
export declare function getMetadata(propertyName: any, cls: any): any;
export declare function Entity(entityNameOrP1?: any): any;
/**
 * Declares a class as an entity.
 * @param c {function} The constructor function of the entity class.
 * @memberof omm
 */
export declare function addEntity(c: TypeClass<Object>): void;
export declare function getDefaultCollectionName(t: TypeClass<any>): string;
export declare function addCollectionRoot(t: TypeClass<any>, collectionName: string): void;
export declare function Wrap(t: any, functionName: string, objectDescriptor: any): void;
export declare function wrap(t: TypeClass<any>, functionName: string): void;
export declare function CollectionUpdate(p1: any, fName?: string): (t: any, functionName: string, objectDescriptor: any) => void;
/**
 * Used to declare a function of a class as a "collection update". That means that whenever the function is called
 * the same operation is also invoked on the document in the collection.
 * @param c {function} The constructor function of the entity class.
 * @param functionName {string} The name of the function that is declared as a "collection update".
 * @param options
 * @memberof omm
 */
export declare function collectionUpdate(c: TypeClass<any>, functionName: string, options?: any): void;
export declare function ArrayOrMap(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
export declare function ArrayType(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
/**
 * Declares the type of the values in the array. This is synonymous to {@link dictionaryType}.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the array property.
 * @param typeClassName {string} The classname of the entity that the array contains.
 * @memberof omm
 */
export declare function arrayType(c: TypeClass<Object>, propertyName: string, typeClassName: string): void;
export declare function DictionaryType(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
/**
 * Declares the type of the values in the dictionary. This is synonymous to {@link arrayType}.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the array property.
 * @param typeClassName {string} The classname of the entity that the array contains.
 * @memberof omm
 */
export declare function dictionaryType(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
export declare function Id(targetPrototypeObject: any, propertyName: string): void;
export declare function Parent(targetPrototypeObject: any, propertyName: string): void;
/**
 * Used to declare which property is used as the value for "_id".
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the id property.
 * @memberof omm
 */
export declare function idProperty(c: TypeClass<Object>, propertyName: string): void;
export declare function Ignore(targetPrototypeObject: any, propertyName: string): void;
/**
 * Declares that a property of an entity is not persisted.
 * @param c {function} The constructor function of the entity class.
 * @param propertyName {string} The name of the id property.
 * @memberof omm
 */
export declare function ignoreProperty(c: TypeClass<Object>, propertyName: string): void;
export declare function DocumentName(name: string): (targetPrototypeObject: any, propertyName: string) => void;
export declare function Type(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
export declare function type(t: TypeClass<Object>, propertyName: string, className: string): void;
export declare function propertyType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
export declare function propertyArrayType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
export declare function propertyDictionaryType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
/**
 * Returns the property previously defined with {@link idProperty} or the _id property.
 * @param o {Object} the object
 * @returns {any}
 * @memberof omm
 */
export declare function getId(o: Object): any;
export declare function className(cls: TypeClass<Object>): string;
export declare function MeteorMethod(p1: any, p2?: any): (t: any, functionName: string, objectDescriptor: any) => void;
export declare class PersistenceAnnotation {
    static getMethodOptions(functionName: string): IMethodOptions;
    static getMethodFunctionNames<T extends Object>(c: any): Array<string>;
    static getMethodFunctionNamesByObject<T extends Object>(o: any): Array<string>;
    static getAllMethodFunctionNames(): Array<string>;
    static getClass<T extends Object>(o: T): TypeClass<T>;
    static getEntityClassByName(className: string): TypeClass<any>;
    static getCollectionClasses(): Array<TypeClass<Object>>;
    static getEntityClasses(): Array<TypeClass<Object>>;
    static getCollectionName(f: TypeClass<any>): string;
    static isRootEntity(f: TypeClass<any>): boolean;
    static isEntity(f: TypeClass<any>): boolean;
    static getDocumentPropertyName(typeClass: TypeClass<any>, objectPropertyName: string): string;
    static getObjectPropertyName(typeClass: TypeClass<any>, documentPropertyName: string): string;
    static isArrayOrMap(f: TypeClass<any>, propertyName: string): boolean;
    static getPropertyClass(f: TypeClass<any>, propertyName: string): TypeClass<any>;
    static getTypedPropertyNames<T extends Object>(f: TypeClass<T>): Array<string>;
    static setPropertyProperty(cls: TypeClass<any>, propertyName: string, property: string, value: any): void;
    private static getPropertyNamesOfPropertiesThatHaveProperties(cls);
    private static getPropertyNamesOfPropertiesThatHaveAProperty(cls, propertyPropertyName);
    private static getPropertyProperty(cls, propertyName, propertyProperty);
    static getParentClass(t: TypeClass<any>): TypeClass<any>;
    static getIdPropertyName(t: TypeClass<any>): string;
    static isIgnored(f: TypeClass<any>, propertyName: string): boolean;
    static isParent(f: TypeClass<any>, propertyName: string): boolean;
    static getParentPropertyNames<T extends Object>(f: TypeClass<T>): Array<string>;
    static getWrappedFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
    private static getCollectionUpdateOptions(cls, functionName);
    static getCollectionUpdateFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
    static getPropertyNamesByMetaData(o: any, metaData: string): string[];
}
