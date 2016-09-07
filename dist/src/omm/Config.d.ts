/**
 * Created by bert on 22.03.16.
 */
export interface MeteorInterface {
    isServer: boolean;
    call: (method: string, ...parameters: any[]) => Promise<any>;
    add: (name: string, f: Function) => void;
}
export interface ObjectIDStatic {
    new (hexString?: string): ObjectID;
}
export interface ObjectID {
    toString(): string;
}
export interface MongoInterface {
    collection(name: string): MongoCollectionInterface;
    ObjectID: ObjectIDStatic;
}
export interface MongoCollectionInterface {
    find(search: any): MongoCursorInterface;
    insert(obj: any): Promise<any>;
    remove(obj: any): Promise<any>;
    updateOne(pattern: any, data: any): Promise<any>;
}
export interface MongoCursorInterface {
    toArray(): Promise<any[]>;
}
