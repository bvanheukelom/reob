import Document from "./Document";
import SubObjectPath from "./SubObjectPath";
import { TypeClass } from "../annotations/PersistenceAnnotation";
export declare class Serializer {
    constructor();
    static forEachTypedObject(object: Object, cb: (path: SubObjectPath, object: Object) => void): void;
    static forEachTypedObjectRecursive(rootObject: Object, object: Object, path: SubObjectPath, visited: Array<Object>, cb: (path: SubObjectPath, object: Object) => void): void;
    toObject<T extends Object>(doc: Document, f?: TypeClass<T>, handler?: any): T;
    private toObjectRecursive<T>(doc, parent, f?);
    toDocument(object: Object): Document;
    private toDocumentRecursive(object, rootClass?, parentObject?, propertyNameOnParentObject?);
    private createDocument(object, rootClass?, parentObject?, propertyNameOnParentObject?);
}
