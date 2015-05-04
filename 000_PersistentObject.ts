/**
 * Created by bert on 03.05.15.
 */
/**
 * Created by bert on 25.04.15.
 */
/// <reference path="./PersistenceDescriptor.ts" />
declare var Meteor:any;
declare function check(p:any, p2:any):void;

// TODO rename to something that contains the word "Meteor".

interface ModifiableObject
{
    persistenceInfo:PersistenceInfo
}

//interface PersistableObject
//{
//    getId():string;
//    toDocument?():Document;
//}


//interface PersistableClass extends Function
//{
//    persistenceDescriptor:PersistenceDescriptor;
//    collection?:BaseCollection;
//}

class PersistenceInfo
{
    path:PersistencePath;
}

class BaseCollection<T extends PersistableObject>
{
    private static isSaving:boolean = false;

    private toDocumentModifiers:Array<Document> = [];
    private meteorCollection:any;
    private documentToObjectFunction:(document:Document)=>PersistableObject;

    constructor( persistableClass:PersistableClass )
    {
        this.meteorCollection = meteorCollection;
        Persistence.collections[meteorCollection._name] = this;
        this.documentToObjectFunction = documentToObject;
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
        var p:PersistableObject = this.documentToObjectFunction(doc);
        (<ModifiableObject><any>p).persistenceInfo = new PersistenceInfo();
        (<ModifiableObject><any>p).persistenceInfo.path = new PersistencePath( this, p.getId() );
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
            var object:PersistableObject = this.documentToObject(document);
            updateFunction(object);

            var documentToSave:Document = Persistence.toDocument(object);
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
        var doc : Document = Persistence.toDocument( p );
        doc.serial = 0;
        this.meteorCollection.insert(doc);
    }

}

interface MeteorPersistableClass extends PersistableClass
{
    collection?:BaseCollection;
}

class Persistence
{

    static collections: { [index:string] : BaseCollection } = {};
    static classes: { [index:string] : any } = {};
    private static wrappedCallInProgress:boolean = false;


    // do not call this from a class. use "createDocument" instead
    static toDocument(object:PersistableObject, excludedProperties?: Array<string>):Document
    {
        var result:Document;
        if( typeof object.toDocument == "function" )
            result = object.toDocument();
        else
            result = Persistence.createDocument(object);
        return result;
    }

    static createDocument(object: any, excludedProperties?: Array<string>): Document
    {
        var doc:any = {};
        for (var property in object)
        {
            if (excludedProperties && excludedProperties.indexOf(property)!=-1 )
            {
                //console.log("Skipping excluded property : " + property);
                continue;
            }
            if (object[property] !== undefined && property != "persistencePath")
            {
                // primitives
                if (typeof object[property] == "string" || typeof object[property] == "number" || typeof object[property] == "date" || typeof object[property] == "boolean")
                    doc[property] = object[property];

                // array
                else if (object[property] instanceof Array)
                {
                    doc[property] = [];
                    var arr:Array<PersistableObject> = object[property];
                    for( var i=0; i<arr.length; i++ )
                    {
                        var subObject = arr[i];
                        doc[property].push(Persistence.toDocument(subObject));
                    }
                }

                // object
                else if (typeof object[property] == 'object')
                {
                    doc[property] = Persistence.toDocument( object[property] );
                }

                else if (typeof object[property] == 'function')
                {
                    // not doing eeeeenithing with functions
                }
                else
                {
                    console.error("Unsupported type : ", typeof object[property]);
                }
            }
        }
        return <Document>doc;
    }

    static apply( o:any, fktName:string, args:Array<any> )
    {
        if(o.isWrapped)
        {
            if(o[fktName].originalFunction)
            {
                return o[fktName].originalFunction.apply(o, args);
            }
        }
        else
            return o[fktName].apply(o,args);
    }

    static persistClass( c:MeteorPersistableClass, collectionName?:string )
    {
        // only wrap classes once
        var className = PersistenceDescriptor.functionName(c);
        if( !Persistence.classes[className] )
        {

            if( collection )
            {
                // also set the collection on the class
                c.collection = collection;
            }

            // iterate over all properties of the prototype. this is where the functions are.
            for (var property in c.prototype )
            {
                // only bother with functions
                if( typeof c.prototype[property]==="function" )
                {
                    // if it is not a getter or something alike?
                    //if( property.indexOf("get")!=0 && property.indexOf("set")!=0 && property.indexOf("is")!=0 && property.indexOf("can")!=0 && property.indexOf("has")!=0 && property.indexOf("to")!=0 && property.indexOf("constructor")!=0 )
                    if( c.persistenceDescriptor.isMarkedAsPersisted(property) )
                    {
                        // replace the function with a wrapper function that either does a meteor call or call to the original
                        console.log("Meteor wrapping function call: "+property+" on "+ className);
                        var f:any = function meteorCallWrapper() {

                            // If this is object is part of persistence and no wrapped call is in progress ...
                            if( !Persistence.wrappedCallInProgress && this.persistencePath )
                            {
                                // hello meteor
                                console.log("Meteor call "+(<any>arguments).callee.functionName+" with arguments "+arguments+" path:",this.persistencePath );
                                Meteor.call( "wrappedCall", this.persistencePath, (<any>arguments).callee.functionName, arguments );
                            }
                            else
                            {
                                // otherwise execute the regular function
                                return (<any>arguments).callee.originalFunction.apply( this, arguments );
                            }
                        };
                        // this stores the old function on the wrapping one
                        f.originalFunction = c.prototype[property];
                        // this keeps the original method name accessible as the closure somehow cant access a loop iterator
                        f.functionName = property;
                        // set the wrapping function on the class
                        c.prototype[property] = f;
                    }
                    // if it is a getter
                    else if( property.indexOf("get")==0 )
                    {
                        // create a function that inspects the result and sets the persistence path on the result
                        var f:any = function() {
                            var result =  (<any>arguments).callee.originalFunction.apply( this, arguments );
                            if( typeof result=="object" )
                            {
                                if (this.persistencePath && !result.persistencePath)
                                {
                                    var pP = this.persistencePath.clone();
                                    pP.appendFunctionCall((<any>arguments).callee.functionName, arguments);
                                    if (Array.isArray(result))
                                    {
                                        for (var i = 0; i < result.length; i++)
                                        {
                                            var ppi = pP.clone();
                                            ppi.appendIndex(i);
                                            result[i].persistencePath = ppi;
                                        }
                                    }
                                    else
                                    {
                                        result.persistencePath = pP;
                                    }
                                }
                            }
                            return result;
                        };
                        f.originalFunction = c.prototype[property];
                        f.functionName = property;
                        c.prototype[property] = f;
                    }
                }
            }
        }
        Persistence.classes[className] = c;
    }


}

// TODO make the persistence Path a class
// TODO take a closer look on how secure this is

// This "monkey-patches" all function calls that do not start with get, set, is, can, has and to. It wraps a meteor call
// around this function call. Once a "wrapped call" is in process all function calls are routed through directly.
// The other thing it does is that all getters are wrapped so that their results also contain a property "persistencePath"
// a persistence path allows to find the object again based on an initially loaded object from meteor so that the wrapped
// function call can then be invoked on the meteor side.






// this registers the meteor function that eventually gets called by the wrapping function
Meteor.methods({
    wrappedCall:function( persistencePath:PersistencePath, functionName:string, args:Array<any> )
    {
        // TODO is this secure?
        check(persistencePath,Object);
        check(functionName, String);
        check(args, Array);


        //PersistentObject.verifiedUpdate( Persistence.collections[persistencePath.collection], {_id:persistencePath.id}, function( o ){
        //    PersistentObject.wrappedCallInProgress = true;
        //    if( persistencePath.path )
        //    {
        //        for( var i=0;i< persistencePath.path.length;i++ )
        //        {
        //            var pathEntry = persistencePath.path[i];
        //            if(typeof pathEntry.index==="number")
        //                o = o[pathEntry.index];
        //            else if(pathEntry.fkt)
        //            {
        //                o = PersistentObject.apply(o, pathEntry.fkt, pathEntry.arguments);
        //            }
        //        }
        //    }
        //    PersistentObject.apply(o, functionName, args);
        //    PersistentObject.wrappedCallInProgress = false;
        //} );
    }
});

//PersistentObject.afterToDocument = function(classConstructor, modificationFunction) {
//    if( !classConstructor.afterToDocument )
//    {
//        classConstructor.afterToDocument = [];
//    }
//    classConstructor.afterToDocument.push( modificationFunction );
//};
//
//PersistentObject.foreignKey = function( classConstructor, propertyName, toKeyFunction, toObjectFunction )
//{
//    Object.defineProperty(classConstructor,propertyName,{ get:function(){
//        if( !PersistentObject.isSaving && !this[propertyName] && this[propertyName+"Id"] )
//        {
//            var v = toObjectFunction(this[propertyName+"Id"]);
//            this[propertyName] = v;
//            return this[propertyName];
//        }
//        else
//            return undefined;
//    }, set:function( value ){
//        this[propertyName] = value;
//        this[propertyName+"Id"] = toKeyFunction( value );
//    }});
//};
