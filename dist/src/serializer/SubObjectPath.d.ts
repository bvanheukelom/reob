export default class SubObjectPath {
    private path;
    constructor(s?: string);
    clone(): SubObjectPath;
    forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
    getSubObject(rootObject: Object): Object;
    appendArrayOrMapLookup(name: string, id: string): void;
    appendPropertyLookup(name: string): void;
    toString(): string;
}
