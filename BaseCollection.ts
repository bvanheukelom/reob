///<reference path="references.d.ts"/>
module persistence {

    export class BaseCollection<T extends Persistable>
    {
        private meteorCollection:any;
        private theClass:TypeClass<T>;
        private name:string;
        private static meteorCollections:{[index:string]:any} = { };

        constructor( persistableClass:TypeClass<T> )
        {
            persistence.MeteorPersistence.init();
            var collectionName = persistence.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if( !MeteorPersistence.collections[collectionName] ) {
                // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
                MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }

        private static _getMeteorCollection( name?:string )
        {
            if( !BaseCollection.meteorCollections[name] )
            {
                BaseCollection.meteorCollections[name] = new (<any>Meteor).Collection( name );
            }
            return BaseCollection.meteorCollections[name];
        }

        getName():string
        {
            return this.name;
        }

        getMeteorCollection( ):any
        {
            return this.meteorCollection;
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
            var p:T = DeSerializer.Serializer.toObject<T>(doc, this.theClass);
            MeteorPersistence.updatePersistencePaths(p);
            return p;
        }

        update(id:string, updateFunction:(o:T)=>void)
        {
            if( !id )
                throw new Error("Id missing");
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
                var result = updateFunction(object);

                MeteorPersistence.updatePersistencePaths(object);

                var documentToSave:Document = DeSerializer.Serializer.toDocument(object);
                documentToSave.serial = currentSerial+1;

                // update the collection
                //console.log("writing document ", documentToSave);
                var updatedDocumentCount = this.meteorCollection.update({
                    _id:id,
                    serial:currentSerial
                }, documentToSave);

                // verify that that went well
                if (updatedDocumentCount == 1){
                    return result; // we're done
                }
                else if (updatedDocumentCount > 1)
                    throw new Meteor.Error( "verifiedUpdate should only update one document");
                else
                {
                    console.log("rerunning verified update ");
                    // we need to do this again
                }
            }
            throw new Error("update gave up after 10 attempts to update the object ");
        }

        protected insert( p:T, cb?:(error:any, insertedObject?:T)=>void ):void
        {
            if( Meteor.isServer )
            {
                var doc : Document = DeSerializer.Serializer.toDocument( p );
                if( p.getId() )
                    doc._id = p.getId();
                doc.serial = 0;
                console.log( "inserting document: ", doc)
                var that = this;
                this.meteorCollection.insert(doc, function(error, resultId:string){
                    if( cb )
                    {
                        var result = that.getById(resultId);
                        MeteorPersistence.updatePersistencePaths(result);
                        if( !error )
                            cb(undefined, result);
                        else
                            cb( error );
                    }
                });
                console.log( "inserting object: ", p, (<any>p).wood );
            }
            else
                throw new Error("Insert can not be called on the client. Wrap it into a meteor method.");
        }

        removeAll( cb:(error,result)=>void){
            if( !this.name )
                throw new Error("Collection has no name");
            console.log("removing all of collection "+this.name);
            Meteor.call("removeAll", this.name, cb);
        }

    }
}

if( Meteor.isServer ) {
    Meteor.methods({
        removeAll: function (collectionName:string) {
            check(collectionName, String);
            persistence.MeteorPersistence.collections[collectionName].getMeteorCollection().remove({});
        }
    });
}
