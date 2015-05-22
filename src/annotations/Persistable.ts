/**
 * Created by bert on 04.05.15.
 */
///<reference path="./Document.ts"/>
///<reference path="./PersistencePath.ts"/>
module omm {
    export interface Persistable {
        getId?():string;
        setId?(s:string):void;
        toDocument?():omm.Document;
        persistencePath?:omm.PersistencePath;
    }
}