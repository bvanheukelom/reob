/**
 * Created by bert on 04.05.15.
 */

import PersistencPath = require("./PersistencePath");

interface Persistable
{
    getId?():string;
    toDocument?():Document;
    persistencePath?:PersistencPath;
}
export = Persistable;