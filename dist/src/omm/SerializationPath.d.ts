import { ObjectContext } from "./ObjectContext";
import { Handler } from "./Handler";
import { OmmObject } from "./OmmObject";
export declare class SerializationPath {
    private path;
    constructor(collectionName: string, id?: string);
    clone(): SerializationPath;
    getCollectionName(): string;
    getId(): string;
    forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
    getSubObject(rootObject: Object): Object;
    appendArrayOrMapLookup(name: string, id: string): void;
    appendPropertyLookup(name: string): void;
    toString(): string;
    static setObjectContext(object: OmmObject, sp: SerializationPath, handler: Handler): void;
    static getObjectContext(object: OmmObject): ObjectContext;
    static updateObjectContexts(object: OmmObject, handler?: Handler, visited?: Array<Object>): void;
}
