/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>

interface Persistable
{
    getId?():string;
    toDocument?():Document;
    persistencePath?:persistence.PersistencePath;
}
