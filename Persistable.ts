/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>

interface Persistable
{
    getId?():string;
    setId?( s:string ):void;
    toDocument?():Document;
    persistencePath?:mapper.PersistencePath;
}
