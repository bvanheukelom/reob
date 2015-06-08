declare module omm {
    interface TypeClass<T> {
        new (): T;
    }
}
declare module omm {
    var entityClasses: {
        [index: string]: omm.TypeClass<Object>;
    };
    function setNonEnumerableProperty(obj: Object, propertyName: string, value: any): void;
    function defineMetadata(propertyName: any, value: any, cls: any): void;
    function getMetadata(propertyName: any, cls: any): any;
    function Entity(p1?: any): any;
    function Wrap(t: Function, functionName: string, objectDescriptor: any): void;
    function ArrayOrMap(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function AsForeignKeys(targetPrototypeObject: any, propertyName: string): void;
    function Ignore(targetPrototypeObject: any, propertyName: string): void;
    function AsForeignKey(targetPrototypeObject: Function, propertyName: string): void;
    function Type(typeClassName: string): (targetPrototypeObject: any, propertyName: string) => void;
    function className(fun: omm.TypeClass<Object>): string;
    class PersistenceAnnotation {
        static getClass<T extends Object>(o: T): omm.TypeClass<T>;
        static getEntityClassByName(className: string): omm.TypeClass<any>;
        static getCollectionClasses(): Array<omm.TypeClass<Object>>;
        static getEntityClasses(): Array<TypeClass<Object>>;
        static getCollectionName(f: TypeClass<any>): string;
        static isRootEntity(f: TypeClass<any>): boolean;
        static isEntity(f: TypeClass<any>): boolean;
        static isArrayOrMap(f: TypeClass<any>, propertyName: string): boolean;
        static getPropertyClass(f: TypeClass<any>, propertyName: string): TypeClass<any>;
        static getTypedPropertyNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static setPropertyProperty(cls: TypeClass<any>, propertyName: string, property: string, value: any): void;
        private static getPropertyProperty(cls, propertyName, propertyProperty);
        static getParentClass(t: TypeClass<any>): TypeClass<any>;
        static isStoredAsForeignKeys(f: TypeClass<any>, propertyName: string): boolean;
        static isIgnored(f: TypeClass<any>, propertyName: string): boolean;
        static getWrappedFunctionNames<T extends Object>(f: TypeClass<T>): Array<string>;
        static getPropertyNamesByMetaData(o: any, metaData: string): string[];
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
    interface Persistable {
        getId?(): string;
        setId?(s: string): void;
        _objectRetriever?: omm.ObjectRetriever;
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
        static needsLazyLoading(object: Persistable, propertyName: string): boolean;
        toObject<T extends omm.Persistable>(doc: Document, f: omm.TypeClass<T>): T;
        private toObjectRecursive<T>(doc, f);
        toDocument(object: omm.Persistable): omm.Document;
        private toDocumentRecursive(object, rootClass?, parentObject?, propertyNameOnParentObject?);
        private createDocument(object, rootClass?, parentObject?, propertyNameOnParentObject?);
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
    class MeteorPersistence {
        static classes: {
            [index: string]: {
                new (): Persistable;
            };
        };
        static collections: {
            [index: string]: omm.BaseCollection<any>;
        };
        static wrappedCallInProgress: boolean;
        static nextCallback: any;
        private static initialized;
        private static meteorObjectRetriever;
        private static serializer;
        static init(): void;
        static objectsClassName(o: any): string;
        static withCallback(p: Function, c: (error: any, result: any) => void): void;
        static wrapClass<T extends Persistable>(c: TypeClass<T>): void;
        private static getClassName(o);
        static wrapFunction(object: any, propertyName: string, meteorMethodName: string, serverOnly: boolean, argumentSerializer: omm.Serializer, objectRetriever: ObjectRetriever): void;
        static monkeyPatch(object: any, functionName: string, patchFunction: (original: Function, ...arg: any[]) => any): void;
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
    class SerializationPath {
        private path;
        private objectRetriever;
        constructor(objectRetriever: omm.ObjectRetriever, className: string, id?: string);
        clone(): SerializationPath;
        getCollectionName(): string;
        getObjectRetriever(): omm.ObjectRetriever;
        getId(): string;
        forEachPathEntry(iterator: (propertyName: string, index: string | number) => void): void;
        getSubObject(rootObject: Object): Object;
        appendArrayOrMapLookup(name: string, id: string): void;
        appendPropertyLookup(name: string): void;
        toString(): string;
    }
}
declare module omm {
    interface MeteorPersistable extends omm.Persistable {
        _serializationPath?: omm.SerializationPath;
    }
    class MeteorObjectRetriever implements omm.ObjectRetriever {
        getId(object: MeteorPersistable): string;
        getObject(s: string): Object;
        preToDocument(o: Object): void;
        postToObject(o: Object): void;
        private setSerializationPath(o, pPath);
        updateSerializationPaths(object: MeteorPersistable, visited?: Array<Persistable>): void;
        retrieveLocalKeys(o: omm.MeteorPersistable, visited?: Array<Object>, rootObject?: omm.MeteorPersistable): void;
    }
}
declare module omm {
    class BaseCollection<T extends omm.Persistable> {
        private meteorCollection;
        private theClass;
        private name;
        private serializer;
        private objectRetriever;
        private static meteorCollections;
        constructor(persistableClass: omm.TypeClass<T>);
        static getCollection<P extends omm.Persistable>(t: omm.TypeClass<P>): BaseCollection<P>;
        private static _getMeteorCollection(name?);
        getName(): string;
        getMeteorCollection(): any;
        getById(id: string): T;
        protected find(findCriteria: any): Array<T>;
        getAll(): Array<T>;
        protected remove(id: string, cb?: (err: any) => void): void;
        protected documentToObject(doc: Document): T;
        update(id: string, updateFunction: (o: T) => void): void;
        insert(p: T, callback?: (e: any, id?: string) => void): string;
        static resetAll(cb: (error?: any) => void): void;
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

declare module 'omm' {
	export=omm;
}
