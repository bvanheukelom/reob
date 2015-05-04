/**
 * Created by bert on 04.05.15.
 */
///<reference path="node_modules\reflect-metadata\reflect-metadata.d.ts"/>

import Persistable = require("./Persistable");
import Document = require("./Document");
import Serializer = require("./Serializer");
declare var Meteor:any;
class BaseCollection<T extends Persistable>
{
    private static isSaving:boolean = false;

    private toDocumentModifiers:Array<Document> = [];
    private meteorCollection:any;
    private documentToObjectFunction:(document:Document)=>T;
    private theClass:Function;

    constructor( persistableClass:Function )
    {
        var collectionName = Reflect.getMetadata("persist:collection", persistableClass );
        this.meteorCollection = new Meteor.Collection( collectionName );
        this.theClass = persistableClass;
    }

    getById(id:string):T
    {
        var o = this.find({
            "_id": id
        });
        return o.length>0?o[0]:undefined;
    }

    protected find(findCriteria:any):Array<T>
    {
        var documents:Array<Document> = this.meteorCollection.find(findCriteria).fetch();
        var objects:Array<T> = [];
        for( var i=0;i<documents.length;i++ )
        {
            var document:Document = documents[i];
            objects[i] = this.documentToObject(document);
            // this looks weird but it describes that we're attaching stuff to an object that's not part of it.
        }
        return objects;
    }

    protected documentToObject( doc:Document ):T
    {
        var p:T = Serializer.toObject<T>(doc, this.theClass);
        //(<ModifiableObject><any>p).persistenceInfo = new PersistenceInfo();
        //(<ModifiableObject><any>p).persistenceInfo.path = new PersistencePath( this, p.getId() );
        return p;
    }

    protected update(id:string, updateFunction:(o:T)=>void)
    {
        for (var i = 0; i < 10; i++)
        {
            var document:Document = this.meteorCollection.findOne({
                _id : id
            });

            if (!document)
                return undefined;

            var currentSerial = document.serial;

            // call the update function
            var object:T = this.documentToObject(document);
            updateFunction(object);

            var documentToSave:Document = Serializer.toDocument(object);
            documentToSave.serial = currentSerial+1;

            // update the collection
            console.log("writing document ", document);
            var updatedDocumentCount = this.meteorCollection.update({
                _id:id,
                serial:currentSerial
            }, document);

            // verify that that went well
            if (updatedDocumentCount == 1)
                return object; // we're done
            else if (updatedDocumentCount > 1)
                throw new Meteor.Error(500, "verifiedUpdate should only update one document");
            else
            {
                console.log("rerunning verified update ");
                // we need to do this again
            }
        }
        return undefined;
    }

    insert( p:T ):void
    {
        if( !p.getId() )
            throw new Error("Object has no Id");
        var doc : Document = Serializer.toDocument( p );
        doc.serial = 0;
        this.meteorCollection.insert(doc);
    }

}

export = BaseCollection;