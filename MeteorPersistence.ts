/**
 * Created by bert on 04.05.15.
 */

import PersistenceAnnotation = require("./PersistenceAnnotation");
import Persistable = require("./Persistable");
import Document = require("./Document");
import Serializer = require("./Serializer");
import PersistencePath = require("./PersistencePath");

declare  var Meteor:any;
interface ModifiableObject
{
    persistenceInfo:PersistenceInfo
}
class PersistenceInfo
{
    path:PersistencePath;
}

class MeteorPersistence
{

    static init()
    {
        var allClasses = PersistenceAnnotation.getCollectionClasses();
        for( var i in allClasses )
        {
            var ctor:Function = allClasses[i];
            PersistenceAnnotation.getSubDocumentPropertyNames(ctor);
        }
    }

}
export = MeteorPersistence
