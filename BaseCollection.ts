/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>

import Persistable = require("./Persistable");
import MeteorPersistence = require("./MeteorPersistence");
import PersistencePath = require("./PersistencePath");
import Document = require("./Document");
import Serializer = require("./Serializer");
import PersistenceAnnotation = require("./PersistenceAnnotation");


class BaseCollection<T extends Persistable>
{
    private meteorCollection:any;
    private theClass:TypeClass<T>;
    private static meteorCollections:{[index:string]:any} = { };

    constructor( persistableClass:TypeClass<T> )
    {
        var collectionName = PersistenceAnnotation.getCollectionName(persistableClass);
        if( !MeteorPersistence.collections[collectionName] )
        {
            // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
            MeteorPersistence.wrapClass( persistableClass );
            MeteorPersistence.collections[collectionName] = this;
        }
        this.meteorCollection = BaseCollection.getMeteorCollection(collectionName);
        this.theClass = persistableClass;
    }

    static getMeteorCollection( name?:string )
    {
        if( !BaseCollection.meteorCollections[name] )
        {
            BaseCollection.meteorCollections[name] = new Mongo.Collection( name );
        }
        return BaseCollection.meteorCollections[name];
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
        for (var i = 0; i < documents.length; i++) {
            var document:Document = documents[i];
            objects[i] = this.documentToObject(document);
        }
        return objects;
    }

    getAll():Array<T>
    {
        return this.find({});
    }

    remove( t:T )
    {
        if( t ) {
            if( t.getId && t.getId() ) {
                this.meteorCollection.remove(t.getId());
            }
            else
                throw new Error("Trying to remove an object that does not have an id.");
        }
    }

    protected documentToObject( doc:Document ):T
    {
        var p:T = Serializer.toObject<T>(doc, this.theClass);
        MeteorPersistence.updatePersistencePaths(p);
        return p;
    }

    update(id:string, updateFunction:(o:T)=>void)
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

            MeteorPersistence.updatePersistencePaths(object);

            var documentToSave:Document = Serializer.toDocument(object);
            documentToSave.serial = currentSerial+1;

            // update the collection
            console.log("writing document ", documentToSave);
            var updatedDocumentCount = this.meteorCollection.update({
                _id:id,
                serial:currentSerial
            }, documentToSave);

            // verify that that went well
            if (updatedDocumentCount == 1){
                return object; // we're done
            }
            else if (updatedDocumentCount > 1)
                throw new Meteor.Error( "verifiedUpdate should only update one document");
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
        if( !p.getId || !p.getId() )
            throw new Error("Object has no Id");
        var doc : Document = Serializer.toDocument( p );
        doc._id = p.getId();
        doc.serial = 0;
        MeteorPersistence.updatePersistencePaths(p);
        this.meteorCollection.insert(doc);
    }

}

export = BaseCollection;