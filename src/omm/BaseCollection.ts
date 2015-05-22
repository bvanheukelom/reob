/// <reference path="./../annotations/Persistable.ts" />
/// <reference path="./../annotations/PersistenceAnnotation.ts" />
/// <reference path="./../serializer/Serializer.ts" />
/// <reference path="./../serializer/ConstantObjectRetriever.ts" />
/// <reference path="./MeteorPersistence.ts" />

module omm {

    export class BaseCollection<T extends Persistable>
    {
        private meteorCollection:any;
        private theClass:TypeClass<T>;
        private name:string;
        private serializer:omm.Serializer;

        private static meteorCollections:{[index:string]:any} = { };

        constructor( persistableClass:TypeClass<T> )
        {
            this.serializer = new omm.Serializer( new MeteorObjectRetriever() );
            var collectionName = omm.PersistenceAnnotation.getCollectionName(persistableClass);
            this.name = collectionName;
            if( !MeteorPersistence.collections[collectionName] ) {
                // as it doesnt really matter which base collection is used in meteor-calls, we're just using the first that is created
                MeteorPersistence.collections[collectionName] = this;
            }
            this.meteorCollection = BaseCollection._getMeteorCollection(collectionName);
            this.theClass = persistableClass;
        }

        static getCollection<P extends Persistable>( t:TypeClass<P> ):BaseCollection<P>
        {
            return MeteorPersistence.collections[omm.PersistenceAnnotation.getCollectionName(t)];
        }

        private static _getMeteorCollection( name?:string )
        {
            if( !BaseCollection.meteorCollections[name] )
            {
                if( name!="users")
                {
                    BaseCollection.meteorCollections[name] = new (<any>Meteor).Collection( name );
                }
                else
                    BaseCollection.meteorCollections[name] = Meteor.users;
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

        protected remove( id:string, cb?:(err:any)=>void )
        {
            if( Meteor.isServer ) {
                if (id) {
                    this.meteorCollection.remove(id,cb);
                }
                else
                    throw new Error("Trying to remove an object that does not have an id.");
            }
            else
                throw new Error("Trying to remove an object from the client. 'remove' can only be called on the server.");
        }

        protected documentToObject( doc:Document ):T
        {
            var p:T = this.serializer.toObject<T>(doc, this.theClass);
            MeteorPersistence.updatePersistencePaths(p);
            return p;
        }

        update(id:string, updateFunction:(o:T)=>void)
        {
            if( !id )
                throw new Error("Id missing");
            for (var i = 0; i < 10; i++)
            {
                var document:omm.Document = this.meteorCollection.findOne({
                    _id : id
                });

                if (!document)
                    return undefined;

                var currentSerial = document.serial;

                // call the update function
                var object:T = this.documentToObject(document);
                var result = updateFunction(object);

                MeteorPersistence.updatePersistencePaths(object);

                var documentToSave:Document = this.serializer.toDocument(object);
                documentToSave.serial = currentSerial+1;

                // update the collection
                console.log("writing document ", documentToSave);
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


        insert( p:T, callback?:(e:any, id?:string)=>void ):string
        {
            if( Meteor.isServer )
            {

                // TODO make sure that this is unique
                if( typeof p.getId!="function" || !p.getId() )
                    p.setId(new (<any>Mongo.ObjectID)()._str);
                var doc : Document = this.serializer.toDocument( p );
                //if( typeof p.getId=="function" && p.getId() )
                //    doc._id = p.getId();
                //else
                //    doc._id = ;

                doc.serial = 0;
                console.log( "inserting document: ", doc);
                var that = this;
                function afterwards(e:any, id?:string){
                    if( !e )
                    {
                        console.log( "inserted into '"+that.getName()+"' new id:"+id);
                        if( typeof p.setId == "function")
                            p.setId(id);
                        else
                            throw new Error("Unable to set Id after an object of class '"+omm.className(that.theClass)+"' was inserted into collection '"+that.name+"'. Either only call insert with objects that already have an ID or declare a 'setId' function on the class.");
                        MeteorPersistence.updatePersistencePaths(p);
                    }
                    else
                        console.log("error while inserting into "+this.name, e);
                    if( callback )
                        callback( e,id );
                }

                try{
                    var id = this.meteorCollection.insert(doc, callback?afterwards:undefined);
                    if( !callback )
                        afterwards(undefined,id);
                    else
                        return id;

                }
                catch( e )
                {
                    if( !callback )
                        afterwards(e);
                }
                return id;
            }
            else
                throw new Error("Insert can not be called on the client. Wrap it into a meteor method.");
        }


        static resetAll( cb:(error?:any)=>void ){
            var arr = [];
            for( var i in BaseCollection.meteorCollections )
                arr.push(BaseCollection.meteorCollections[i]);
            if( arr.length>0 ){
                for( var j in arr )
                {
                    if( j!=arr.length-1)
                        Meteor.wrapAsync(function(cb2){
                            arr[j].remove({},cb2);
                        })();
                    else {
                        arr[j].remove({}, cb);
                    }
                }
            }
            else
                cb();

        }

    }
}
omm.MeteorPersistence.wrapFunction( omm.BaseCollection, "resetAll", "resetAll", true, null, new omm.ConstantObjectRetriever(omm.BaseCollection) );

