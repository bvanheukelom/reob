declare module omm {
    interface Document {
        _id?: string;
        serial?: number;
        className?: string;
    }
}
declare module omm {
    interface TypeClass<T> {
        new (...some: any[]): T;
        toDocument?(o: T): Document;
        toObject?(doc: Document): T;
    }
}
declare var Reflect: any;
declare module omm {
    function Entity(p1?: any): any;
    function Wrap(t: Function, functionName: string, objectDescriptor: any): void;
    function ArrayOrMap(typeClassName: string): (targetPrototypeObject: Function, propertyName: string) => void;
    function AsForeignKeys(targetPrototypeObject: Function, propertyName: string): void;
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
        static getPropertyClass(f: Function, propertyName: string): TypeClass<Object>;
        static getTypedPropertyNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static setPropertyProperty(targetPrototypeObject: Function, propertyName: string, property: string, value: any): void;
        static getPropertyProperty(targetPrototypeObject: Function, propertyName: string, propertyProperty: string): any;
        static isStoredAsForeignKeys(typeClass: Function, propertyName: string): boolean;
        static getWrappedFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static getPropertyNamesByMetaData(o: any, metaData: string): string[];
    }
    class _registred {
        static entityClasses: {
            [index: string]: omm.TypeClass<Object>;
        };
    }
}
declare module omm {
    class PersistencePath {
        private path;
        constructor(className: string, id?: string);
        clone(): PersistencePath;
        getCollectionName(): string;
        getId(): string;
        forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
        getSubObject(rootObject: Object): Object;
        appendArrayOrMapLookup(name: string, id: string): void;
        appendPropertyLookup(name: string): void;
        toString(): string;
    }
}
declare module omm {
    class ConstantObjectRetriever implements ObjectRetriever {
        private value;
        constructor(o: Object);
        getId(o: Object): string;
        getObject(s: string): Object;
        retrieveLocalKeys(o: Object): void;
    }
}
declare module omm {
    interface ObjectRetriever {
        getId(o: Object): any;
        getObject(s: string): Object;
        retrieveLocalKeys(o: Object): void;
    }
}
declare module omm {
    interface Persistable {
        getId?(): string;
        setId?(s: string): void;
        toDocument?(): omm.Document;
        persistencePath?: omm.PersistencePath;
    }
}
declare module omm {
    class Serializer {
        objectRetriever: ObjectRetriever;
        constructor(retri: ObjectRetriever);
        toObject<T extends omm.Persistable>(doc: Document, f: omm.TypeClass<T>): T;
        toDocument(object: omm.Persistable, rootClass?: omm.TypeClass<omm.Persistable>, parentObject?: omm.Persistable, propertyNameOnParentObject?: string): omm.Document;
        createDocument(object: any, rootClass?: omm.TypeClass<omm.Persistable>, parentObject?: omm.Persistable, propertyNameOnParentObject?: string): Document;
        getClassName(o: Object): string;
    }
}
