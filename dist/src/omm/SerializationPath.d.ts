import { MeteorPersistable } from "./MeteorPersistable";
export declare class SerializationPath {
    private path;
    isClient: boolean;
    constructor(collectionName: string, id?: string);
    clone(): SerializationPath;
    getCollectionName(): string;
    getId(): string;
    forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
    getSubObject(rootObject: Object): Object;
    appendArrayOrMapLookup(name: string, id: string): void;
    appendPropertyLookup(name: string): void;
    toString(): string;
    static setSerializationPath(o: MeteorPersistable, pPath: SerializationPath): void;
    static updateSerializationPaths(object: MeteorPersistable, visited?: Array<Object>): void;
}
