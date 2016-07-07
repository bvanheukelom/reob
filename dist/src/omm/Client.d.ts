/**
 * Created by bert on 07.07.16.
 */
import * as omm from "../omm";
export declare class Client implements omm.Handler {
    private serializer;
    private webMethods;
    private singletons;
    constructor(host: string, port: number);
    addSingleton(name: string, singleton: any): void;
    load<T>(cls: omm.TypeClass<T>, id: string): Promise<T>;
    call(methodName: string, objectId: string, args: any[]): Promise<any>;
    private getSingletonKey(o);
    webMethod(entityClass: omm.TypeClass<any>, functionName: string, object: omm.OmmObject, originalFunction: Function, args: any[]): any;
}
