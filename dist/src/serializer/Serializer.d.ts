import Document from "./Document";
import * as omm from "../omm";
import SubObjectPath from "./SubObjectPath";
import { TypeClass } from "../annotations/PersistenceAnnotation";
export declare class Serializer {
    constructor();
    static forEachTypedObject(object: Object, cb: (path: SubObjectPath, object: Object) => void): void;
    static forEachTypedObjectRecursive(rootObject: Object, object: Object, path: SubObjectPath, visited: Array<Object>, cb: (path: SubObjectPath, object: Object) => void): void;
    toObject(doc: Document, handler?: any, f?: TypeClass<any>, serializationPath?: omm.SerializationPath): any;
    private toObjectRecursive<T>(doc, parent, f?, handler?);
    toDocument(object: Object, includeContext?: boolean, omitPropertiesPrivateToServer?: boolean): Document;
    private toDocumentRecursive(object, includeContext?, omitPropertiesPrivateToServer?, rootClass?, parentObject?, propertyNameOnParentObject?);
    private createDocument(object, includeContext?, omitPropertiesPrivateToServer?, rootClass?, parentObject?, propertyNameOnParentObject?);
}
