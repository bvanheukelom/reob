import { OmmObject } from "./OmmObject";
export declare var methodContext: any;
export declare function registerObject<O extends Object>(key: string, o: O): void;
export declare function getRegisteredObject(key: string): any;
export declare class MeteorPersistence {
    private static initialized;
    static init(): void;
    static isInitialized(): boolean;
    static objectsClassName(o: any): string;
    getKey(object: OmmObject): string;
    private static getClassName(o);
    static monkeyPatch(object: any, functionName: string, patchFunction: (original: Function, ...arg: any[]) => any): void;
}
export declare function init(): void;
