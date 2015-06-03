/// <reference path="../../typings/node/node.d.ts" />
declare module omm {
    interface TypeClass<T> {
        new (...some: any[]): T;
    }
}
declare var Reflect: any;
declare module omm {
    var entityClasses: {
        [index: string]: omm.TypeClass<Object>;
    };
    function Entity(p1?: any): any;
    function Wrap(t: Function, functionName: string, objectDescriptor: any): void;
    function ArrayOrMap(typeClassName: string): (targetPrototypeObject: Function, propertyName: string) => void;
    function AsForeignKeys(targetPrototypeObject: Function, propertyName: string): void;
    function Ignore(targetPrototypeObject: Function, propertyName: string): void;
    function AsForeignKey(targetPrototypeObject: Function, propertyName: string): void;
    function Type(typeClassName: string): (targetPrototypeObject: Function, propertyName: string) => void;
    function className(fun: omm.TypeClass<Object>): string;
    class PersistenceAnnotation {
        static getClass<T extends Object>(o: T): omm.TypeClass<T>;
        static getEntityClassByName(className: string): omm.TypeClass<any>;
        static getCollectionClasses(): Array<omm.TypeClass<Object>>;
        static getEntityClasses(): Array<TypeClass<Object>>;
        static getCollectionName(f: TypeClass<any>): string;
        static isRootEntity(f: TypeClass<any>): boolean;
        static isEntity(f: TypeClass<any>): boolean;
        static isArrayOrMap(typeClass: Function, propertyName: string): boolean;
        static getPropertyClass(f: Function, propertyName: string): TypeClass<any>;
        static getTypedPropertyNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static setPropertyProperty(targetPrototypeObject: Function, propertyName: string, property: string, value: any): void;
        static getPropertyProperty(targetPrototypeObject: Function, propertyName: string, propertyProperty: string): any;
        static isStoredAsForeignKeys(typeClass: Function, propertyName: string): boolean;
        static isIgnored(typeClass: Function, propertyName: string): boolean;
        static getWrappedFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static getPropertyNamesByMetaData(o: any, metaData: string): string[];
    }
}
declare module omm {
    class ConstantObjectRetriever implements ObjectRetriever {
        private value;
        constructor(o: Object);
        getId(o: Object): string;
        getObject(s: string): Object;
        preToDocument(o: Object): void;
        postToObject(o: Object): void;
    }
}
declare module omm {
    interface Document {
        _id?: string;
        serial?: number;
        className?: string;
    }
}
declare module omm {
    class SubObjectPath {
        private path;
        constructor(s?: string);
        clone(): SubObjectPath;
        forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
        getSubObject(rootObject: Object): Object;
        appendArrayOrMapLookup(name: string, id: string): void;
        appendPropertyLookup(name: string): void;
        toString(): string;
    }
}
declare module omm {
    class Serializer {
        private objectRetriever;
        constructor(retri: ObjectRetriever);
        static init(): void;
        private static installLazyLoaderGetterSetters(c);
        static forEachTypedObject(object: omm.Persistable, cb: (path: omm.SubObjectPath, object: omm.Persistable) => void): void;
        static forEachTypedObjectRecursive(rootObject: omm.Persistable, object: omm.Persistable, path: omm.SubObjectPath, visited: Array<Persistable>, cb: (path: omm.SubObjectPath, object: omm.Persistable) => void): void;
        static setNonEnumerablePropertyProperty(obj: Object, propertyName: string, value: any): void;
        static needsLazyLoading(object: Persistable, propertyName: string): boolean;
        toObject<T extends omm.Persistable>(doc: Document, f: omm.TypeClass<T>): T;
        private toObjectRecursive<T>(doc, f);
        toDocument(object: omm.Persistable): omm.Document;
        private toDocumentRecursive(object, rootClass?, parentObject?, propertyNameOnParentObject?);
        private createDocument(object, rootClass?, parentObject?, propertyNameOnParentObject?);
    }
}
declare module omm {
    interface ObjectRetriever {
        getId(o: Object): any;
        getObject(value: string, parentObject?: Object, propertyName?: string): Object;
        preToDocument(o: Object): any;
        postToObject(o: Object): any;
    }
}
declare module omm {
    interface Persistable {
        getId?(): string;
        setId?(s: string): void;
        _objectRetriever?: omm.ObjectRetriever;
    }
}
declare module omm {
    class LocalObjectRetriever implements omm.ObjectRetriever {
        constructor();
        private setQuietProperty(obj, propertyName, value);
        getId(o: Object): string;
        getObject(s: string, parentObject?: Object, propertyName?: string): Object;
        preToDocument(o: Object): void;
        postToObject(o: Object): void;
    }
}
