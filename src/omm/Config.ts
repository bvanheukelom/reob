/**
 * Created by bert on 22.03.16.
 */

export interface MeteorInterface {
    isServer:boolean;
    call: (method:string, ...parameters:any[]) => Promise<any>;
    add:( name:string, f:Function ) => void;
}

export interface ObjectIDStatic {
    new(hexString?: string): ObjectID;
}
export interface ObjectID {
    toString():string;
}

export interface MongoInterface {
    collection( name:string ):MongoCollectionInterface;
    ObjectID: ObjectIDStatic;
}

export interface MongoCollectionInterface {
    find(search:any):MongoCursorInterface;
    insert( obj:any ):Promise<any>;
    remove( obj:any ):Promise<any>;
    updateOne( pattern:any, data:any ):Promise<any>;
}

export interface MongoCursorInterface {
    toArray():Promise<any[]>;
}


import {environmentReferences} from "../annotations/PersistenceAnnotation"

export function config( options:{ Meteor? : MeteorInterface, Mongo?: MongoInterface } ) {
    if( options.Meteor )
        environmentReferences.meteorReference = options.Meteor;

    if( options.Mongo ) {
        environmentReferences.mongoReference = options.Mongo;
    }
}

export function getMeteor():MeteorInterface{
    return environmentReferences.meteorReference;
}

export function getMongo():MongoInterface{
    return environmentReferences.mongoReference;
}