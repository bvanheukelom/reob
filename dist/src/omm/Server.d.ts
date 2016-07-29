/**
 * Created by bert on 07.07.16.
 */
import * as omm from "../omm";
export declare class Server {
    private collections;
    private singletons;
    private webMethods;
    private serializer;
    private methodListener;
    constructor(express: any);
    addCollection(c: omm.Collection<any>): void;
    addSingleton(name: string, singleton: any): void;
    private notifyMethodListeners(object, objectId, functionName, args, userData);
    onMethod(eventHandler: omm.EventListener<any>): void;
    removeAllMethodListeners(): void;
    static userData: any;
    private addAllWebMethods();
    private getCollection(objectId);
    private retrieveObject(objectId);
    private attachClassName(o);
    private registerGetter();
    private convertWebMethodParameters(args, classNames);
}
