/**
 * Created by bert on 04.05.15.
 */
///<reference path="./Document.ts"/>
///<reference path="./SerializationPath.ts"/>
module omm {

    // TODO rename to "Serializable"

    export interface Persistable {
        getId?():string;
        setId?(s:string):void;
        toDocument?():omm.Document;
        _serializationPath?:omm.SerializationPath;
    }
}