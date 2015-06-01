/**
 * Created by bert on 04.05.15.
 */
///<reference path="./Document.ts"/>

module omm {

    // TODO rename to "Serializable"

    export interface Persistable {
        getId?():string;
        setId?(s:string):void;
        _objectRetriever:omm.ObjectRetriever
        //toDocument?():omm.Document;
    }
}