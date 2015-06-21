/// <reference path="../../typings/node/node.d.ts" />
declare module omm {
    interface TypeClass<T> {
        new (): T;
    }
}
interface IMethodOptions {
    isStatic?: boolean;
    object?: string | Object;
    name?: string;
    parameterTypes?: Array<string>;
    resultType?: string;
    parentObject?: Object;
    functionName?: string;
    replaceWithCall?: boolean;
}
declare module omm {
    var entityClasses: {
        [index: string]: omm.TypeClass<Object>;
    };
    var registeredObjects: {
        [index: string]: any;
    };
    var meteorMethodFunctions: {
        [index: string]: Object;
    };
    function setNonEnumerableProperty(obj: Object, propertyName: string, value: any): void;
    function defineMetadata(propertyName: any, value: any, cls: any): void;
    function getMetadata(propertyName: any, cls: any): any;
    function Entity(p1: Function): any;
    function addEntity(cls: TypeClass<Object>): void;
    function getDefaultCollectionName(t: omm.TypeClass<any>): string;
    function addCollectionRoot(t: omm.TypeClass<any>, collectionName: string): void;
    function Wrap(t: Function, functionName: string, objectDescriptor: any): void;
    function CollectionUpdate(p1: any, fName?: string): (t: Function, functionName: string, objectDescriptor: any) => void;
    function ArrayOrMap(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function ArrayType(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function DictionaryType(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function AsForeignKeys(targetPrototypeObject: any, propertyName: string): void;
    function Id(targetPrototypeObject: any, propertyName: string): void;
    function Ignore(targetPrototypeObject: any, propertyName: string): void;
    function DocumentName(name: string): (targetPrototypeObject: any, propertyName: string) => void;
    function AsForeignKey(targetPrototypeObject: Function, propertyName: string): void;
    function Type(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function propertyType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
    function propertyArrayType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
    function propertyDictionaryType(t: TypeClass<Object>, propertyName: string, typeClassName: string): void;
    function asForeignKey(t: TypeClass<Object>, propertyName: string): void;
    function ignoreProperty(t: TypeClass<Object>, propertyName: string): void;
    function getId(o: Object): any;
    function className(fun: omm.TypeClass<Object>): string;
    function MeteorMethod(p1: any, p2?: any): (t: Function, functionName: string, objectDescriptor: any) => void;
    function StaticMeteorMethod(p1: any, p2?: any): (t: Function, functionName: string, objectDescriptor: any) => void;
    class PersistenceAnnotation {
        static getMethodOptions(functionName: string): IMethodOptions;
        static getMethodFunctionNames<T extends Object>(c: any): Array<string>;
        static getMethodFunctionNamesByObject<T extends Object>(o: any): Array<string>;
        static getAllMethodFunctionNames(): Array<string>;
        static getClass<T extends Object>(o: T): omm.TypeClass<T>;
        static getEntityClassByName(className: string): omm.TypeClass<any>;
        static getCollectionClasses(): Array<omm.TypeClass<Object>>;
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
        private static getPropertyProperty(cls, propertyName, propertyProperty);
        static getParentClass(t: TypeClass<any>): TypeClass<any>;
        static getIdPropertyName(t: TypeClass<any>): string;
        static isStoredAsForeignKeys(f: TypeClass<any>, propertyName: string): boolean;
        static isIgnored(f: TypeClass<any>, propertyName: string): boolean;
        static getWrappedFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
        private static getCollectionUpdateOptions(cls, functionName);
        static getCollectionUpdateFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
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
        static forEachTypedObject(object: Object, cb: (path: omm.SubObjectPath, object: Object) => void): void;
        static forEachTypedObjectRecursive(rootObject: Object, object: Object, path: omm.SubObjectPath, visited: Array<Object>, cb: (path: omm.SubObjectPath, object: Object) => void): void;
        static needsLazyLoading(object: Object, propertyName: string): boolean;
        toObject<T extends Object>(doc: Document, f?: omm.TypeClass<T>): T;
        private toObjectRecursive<T>(doc, f?);
        toDocument(object: Object): omm.Document;
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
    class LocalObjectRetriever implements omm.ObjectRetriever {
        constructor();
        private setQuietProperty(obj, propertyName, value);
        getId(o: Object): string;
        getObject(s: string, parentObject?: Object, propertyName?: string): Object;
        preToDocument(o: Object): void;
        postToObject(o: Object): void;
    }
}
