/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>
import PersistenceAnnotation = require("./PersistenceAnnotation");
import Persistable = require("./Persistable");
import Document = require("./Document");
import Serializer = require("./Serializer");
import PersistencePath = require("./PersistencePath");
import BaseCollection = require("./BaseCollection");

interface TypeClass<T> { new(): T ;}

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
    static classes:{[index:string]:{ new(): Persistable ;}} = {};
    static collections:{[index:string]:BaseCollection<any>} = {};
    static wrappedCallInProgress = false;
    private static initialized = false;

    static init()
    {
        if( !MeteorPersistence.initialized  )
        {
            PersistenceAnnotation.getEntityClasses().forEach(function(c:TypeClass<Persistable>){
                MeteorPersistence.wrapClass( c );
            });
            MeteorPersistence.initialized = true;
        }
    }

    private static apply( o:any, fktName:string, args:Array<any> )
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

    // TODO new name
    static objectsClassName(o:any):string
    {
        return PersistenceAnnotation.className( o.constructor );
    }

    static wrapClass<T extends Persistable>( c:TypeClass<T>  )
    {
        var className = PersistenceAnnotation.className(c);
        console.log("Wrapping transactional functions for class "+className);
        // iterate over all properties of the prototype. this is where the functions are.
        PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function(functionName){
            var originalFunction:Function = <Function>c.prototype[functionName];
            // replace the function with a wrapper function that either does a meteor call or call to the original
            console.log("Wrapping transactional functions for class "+className+" function: "+functionName);
            var f:any = function meteorCallWrapper() {

                // If this is object is part of persistence and no wrapped call is in progress ...
                if (!MeteorPersistence.wrappedCallInProgress && this.persistencePath ) {
                    // hello meteor
                    console.log("Meteor call " + (<any>arguments).callee.functionName + " with arguments " , arguments , " path:", this.persistencePath);
                    var typeNames:Array<string> = [];
                    for( var ai=0;ai<arguments.length;ai++ )
                    {
                        typeNames.push(MeteorPersistence.objectsClassName(arguments[ai]));
                    }
                    Meteor.call("wrappedCall", this.persistencePath.toString(), (<any>arguments).callee.functionName, arguments, typeNames);
                }

                // also call the method on the current object so that it reflects the update
                return (<any>arguments).callee.originalFunction.apply(this, arguments);
            };
            // this stores the old function on the wrapping one
            f.originalFunction = originalFunction;
            // this keeps the original method name accessible as the closure somehow cant access a loop iterator
            f.functionName = functionName;
            // set the wrapping function on the class
            c.prototype[functionName] = f;
        });

        PersistenceAnnotation.getTypedPropertyNames(c).forEach(function(propertyName:string){
            if( PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName) ) {
                console.log("On Class "+className+ ": creating lazy loader for " + propertyName);
                var propertyDescriptor = Object.getOwnPropertyDescriptor(c.prototype, propertyName);

                Object.defineProperty(c.prototype, propertyName, {
                    get: function ():any {
                        // TODO this doesnt work for subdocuments
                        //console.log("Monkey patched getter "+propertyName);
                        var v:any;
                        if (propertyDescriptor && propertyDescriptor.get)
                            v = propertyDescriptor.get.apply(this);
                        else
                            v = this["_" + propertyName];
                        if (typeof v == "string") {
                                var persistencePath = new PersistencePath(v);
                                var propertyClassName = persistencePath.getClassName();
                                var collection:BaseCollection<Persistable> = propertyClassName ? MeteorPersistence.collections[propertyClassName] : undefined;
                                if( collection )
                                {
                                    var rootValue = collection.getById(persistencePath.getId());
                                    var newValue = rootValue ? persistencePath.getSubObject(rootValue):undefined;
                                    console.log("Lazy loading "+className+"."+propertyName+" foreign key:"+ v +". Loaded: "+newValue);
                                    v = newValue;
                                }
                                else
                                    throw new Error("No collection found for lazy loading "+className+"."+propertyName+" foreign key:"+ v +". Loaded: "+newValue);
                            this[propertyName] = v;
                        }
                        else if (Array.isArray(v)) // TODO this could be improved so that it loads them when they are accessed rather than to load them all at once
                        {
                            var arr:Array<any> = (<Array<any>>v);
                            if (arr.length > 0 && typeof arr[0] == "string") {
                                arr.forEach(function (ele:string, index:number) {
                                    if (typeof ele != "string")
                                        throw new Error("There should be only ids in the array.");
                                    arr[index] = collection.getById(ele);
                                });
                            }
                        }
                        //console.log("Monkey patched getter "+propertyName+" returns ",v);
                        return v;
                    },
                    set: function (v:any) {
                        console.log("Monkey patched setter "+propertyName+" v:"+v);

                        if (propertyDescriptor && propertyDescriptor.set)
                            propertyDescriptor.set.apply(this, arguments);
                        else {
                            if (!Object.getOwnPropertyDescriptor(this, "_" + propertyName)) {
                                Object.defineProperty(this, "_" + propertyName, {
                                    configurable: false,
                                    enumerable: false,
                                    writable: true
                                });
                            }
                            this["_" + propertyName] = v;
                        }
                    },
                    configurable: propertyDescriptor ? propertyDescriptor.configurable : true,
                    enumerable: propertyDescriptor ? propertyDescriptor.enumerable : true
                });
            }
            else
                console.log("On Class "+className+ ": no lazy loader for " + propertyName);

        });
    }

    static needsLazyLoading( object:Persistable, propertyName:string )
    {
        // TODO inheritance
        var oc = PersistenceAnnotation.getClass(object);
        var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_"+propertyName);
        return PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName)  && !!shadowpropertyDescriptor && (typeof object["_"+propertyName]=="string" );
    }

    static updatePersistencePaths(object:Persistable, visited?:Array<Persistable>):void {
        if(!visited)
            visited = [];
        if( visited.indexOf(object)!=-1 )
            return;
        if( !Object.getOwnPropertyDescriptor(object,"persistencePath") )
        {
            Object.defineProperty(object,"persistencePath", {
                configurable: false,
                enumerable: false,
                writable: true
            });
        }
        visited.push(object);
        var objectClass = PersistenceAnnotation.getClass(object);
        if( PersistenceAnnotation.isRootEntity(objectClass) ) {
            if( !object.persistencePath ) {
                if( object.getId && object.getId() )
                    object.persistencePath = new PersistencePath(PersistenceAnnotation.className(objectClass), object.getId() )
                else
                    throw new Error( "Can not set the persistence path of root collection object without id. Class:"+PersistenceAnnotation.className(objectClass) );
            }
        }
        else
        {
            if( !object.persistencePath )
                throw new Error( "Can not set the persistence path of non root collection object.");
        }
        PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function(typedPropertyName:string){
            if( !PersistenceAnnotation.isStoredAsForeignKeys(objectClass,typedPropertyName) ) {
                var v:Persistable = object[typedPropertyName];
                if( v ) {
                    if (Array.isArray(v)) {
                        (<Array<Persistable>>v).forEach(function (e:Persistable) {

                            if (e.getId && e.getId()) {
                                e.persistencePath = object.persistencePath.clone();
                                e.persistencePath.appendPropertyLookup(typedPropertyName)
                                e.persistencePath.appendArrayLookup(e.getId());
                                MeteorPersistence.updatePersistencePaths(e, visited);
                            }
                            else
                                throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + PersistenceAnnotation.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
                        });
                    }
                    else {
                        v.persistencePath = object.persistencePath.clone();
                        v.persistencePath.appendPropertyLookup(typedPropertyName);
                        MeteorPersistence.updatePersistencePaths(v, visited);
                    }
                }
            }
            else {
                if( !MeteorPersistence.needsLazyLoading(object, typedPropertyName) ) {
                    var v:Persistable = object[typedPropertyName];
                    if( v ) {
                        if (Array.isArray(v)) {
                            (<Array<Persistable>>v).forEach(function (e:Persistable) {
                                if (!e.persistencePath)
                                    MeteorPersistence.updatePersistencePaths(e, visited);
                            });
                        }
                        else if (!v.persistencePath)
                            MeteorPersistence.updatePersistencePaths(v, visited);
                    }
                }
            }
        });
    }
}


Meteor.methods({
    wrappedCall:function( persistencePathString:string, functionName:string, args:Array<any>, typeNames:Array<string> )
    {
        // TODO authentication

        console.log("meteor method: wrappedCall arguments: ", arguments, typeNames );
        check(persistencePathString,String);
        check(functionName, String);
        check(args, Array);
        check(typeNames, Array);
        if( args.length!=typeNames.length )
            throw new Error("array length does not match");

        debugger;
        var persistencePath = new PersistencePath(persistencePathString);
        for( var ai = 0; ai<args.length; ai++ )
        {
            if( PersistenceAnnotation.getEntityClassByName(typeNames[ai]) )
            {
                console.log("deserializing "+typeNames[ai] );
                args[ai] = Serializer.toObject(args[ai], PersistenceAnnotation.getEntityClassByName(typeNames[ai]) );
            }
        }
        var collection:BaseCollection<any> = MeteorPersistence.collections[persistencePath.getClassName()];
        try
        {
            MeteorPersistence.wrappedCallInProgress = true;
            collection.update( persistencePath.getId(), function( o ){
                var subDocument:any = persistencePath.getSubObject( o );
                if( subDocument )
                {
                    var fkt = subDocument[functionName];
                    if (fkt && fkt.originalFunction)
                        fkt = fkt.originalFunction;
                    console.log("function: "+fkt);
                    console.log("type of: ", typeof o, "typeof ");
                    if (fkt)
                        return fkt.apply(o, args);
                }
                else
                    console.log("did not find subdocument");
            } );

        }
        finally
        {
            MeteorPersistence.wrappedCallInProgress = false;
        }
    }
});

export = MeteorPersistence
