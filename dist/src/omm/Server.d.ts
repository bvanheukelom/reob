/**
 * Created by bert on 07.07.16.
 */
import * as omm from "../omm";
export declare class Server {
    private collections;
    private singletons;
    private webMethods;
    private serializer;
    constructor();
    addCollection(c: omm.Collection<any>): void;
    addSingleton(name: string, singleton: any): void;
    private addAllWebMethods();
    start(expressOrPort: any): Promise<void>;
    private retrieveObject(objectId);
    private attachClassName(o);
    private createWebMethod(options);
    registerGetter(): void;
    private convertWebMethodParameters(args, classNames);
}
