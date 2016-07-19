export declare class MeteorPersistence {
    private static initialized;
    static init(): void;
    static isInitialized(): boolean;
    static monkeyPatch(object: any, functionName: string, patchFunction: (original: Function, ...arg: any[]) => any): void;
}
export declare function init(): void;
