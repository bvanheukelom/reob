import Serializer from "../serializer/Serializer";
import ObjectRetriever from "../serializer/ObjectRetriever";
import { MeteorPersistable } from "./MeteorPersistable";
import * as omm_annotation from "../annotations/PersistenceAnnotation";
import * as Promise from "bluebird";
export declare var methodContext: any;
export declare class CallHelper<T extends Object> {
    object: T;
    callback: (error: any, result?: any) => void;
    constructor(o: any, cb?: (error: any, result?: any) => void);
}
export declare function registerObject<O extends Object>(key: string, o: O): void;
export declare function getRegisteredObject(key: string): any;
export declare class MeteorPersistence {
    static wrappedCallInProgress: boolean;
    static nextCallback: any;
    private static initialized;
    static meteorObjectRetriever: ObjectRetriever;
    static serializer: Serializer;
    static db: any;
    static serverWebMethods: any;
    static clientWebMethods: any;
    static init(): void;
    static isInitialized(): boolean;
    static attachClassName(o: any): void;
    static objectsClassName(o: any): string;
    getId(object: MeteorPersistable): string;
    static retrieveObject(objectId: string): Promise<any>;
    static convertWebMethodParameters(args: Array<any>, classNames: Array<string>): void;
    private static webMethodInProgress;
    static createWebMethod(options: omm_annotation.IMethodOptions): void;
    /**
     * This patches the functions that are collection updates.
     * It also emits update events: pre:<FunctionName> post:<FunctionName>.
     * @param c
     */
    static wrapClass<T extends Object>(entityClass: omm_annotation.TypeClass<T>): void;
    private static getClassName(o);
    static monkeyPatch(object: any, functionName: string, patchFunction: (original: Function, ...arg: any[]) => any): void;
}
export declare function load<T>(cls: omm_annotation.TypeClass<T>, id: string): Promise<T>;
export declare function init(host: string, port: number): void;
export declare function isServer(): boolean;
export declare function startServer(mongoUrl: string, port: number): Promise<any>;
