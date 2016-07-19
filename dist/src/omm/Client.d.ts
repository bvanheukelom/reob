/**
 * Created by bert on 07.07.16.
 */
import * as omm from "../omm";
import { INetwork } from "./INetwork";
export declare class Client implements omm.Handler {
    private serializer;
    private userData;
    private webMethods;
    private singletons;
    private network;
    constructor(host: string, port: number, network?: INetwork);
    addSingleton(name: string, singleton: any): void;
    load<T>(clsOrString: omm.TypeClass<T> | string, id: string): Promise<T>;
    loadDocument<T>(clsOrString: omm.TypeClass<T> | string, id: string): Promise<T>;
    private call(methodName, objectId, args);
    private getSingletonKey(o);
    static webMethodRunning: boolean;
    webMethod(entityClass: omm.TypeClass<any>, functionName: string, object: omm.OmmObject, originalFunction: Function, args: any[]): any;
    setUserData(ud: any): void;
}
