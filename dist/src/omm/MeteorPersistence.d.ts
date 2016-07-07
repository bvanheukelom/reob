import { OmmObject } from "./OmmObject";
export declare class MeteorPersistence {
    private static initialized;
    static init(): void;
    static isInitialized(): boolean;
    getKey(object: OmmObject): string;
    static monkeyPatch(object: any, functionName: string, patchFunction: (original: Function, ...arg: any[]) => any): void;
}
export declare function init(): void;
