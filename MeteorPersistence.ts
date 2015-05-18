/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>
module persistence {
    export interface TypeClass<T> { new(): T ;
    }

    export class MeteorPersistence {
        static classes:{[index:string]:{ new(): Persistable ;}} = {};
        static collections:{[index:string]:persistence.BaseCollection<any>} = {};
        static wrappedCallInProgress = false;
        static nextCallback;
        private static initialized = false;
        private static meteorObjectRetriever = new MeteorObjectRetriever();
        private static serializer = new DeSerializer.Serializer( MeteorPersistence.meteorObjectRetriever );

        static init() {
            if (!MeteorPersistence.initialized) {
                persistence.PersistenceAnnotation.getEntityClasses().forEach(function (c:TypeClass<Persistable>) {
                    MeteorPersistence.wrapClass(c);
                });
                MeteorPersistence.initialized = true;
            }
        }

        // TODO new name
        static objectsClassName(o:any):string {
            return persistence.PersistenceAnnotation.className(o.constructor);
        }

        //private static loadPath(s:string):Persistable {
        //    if (typeof s != "string")
        //        throw new Error("Path needs to be a string");
        //    var persistencePath = new persistence.PersistencePath(s);
        //    var typeClass:TypeClass<any> = persistence.PersistenceAnnotation.getEntityClassByName( persistencePath.getClassName() );
        //    if( !typeClass || typeof typeClass != "function" )
        //        throw new Error( "Could not load path. No class found for class name :"+ persistencePath.getClassName()+". Total path:"+s );
        //    var collectionName = persistence.PersistenceAnnotation.getCollectionName( typeClass );
        //    var collection:persistence.BaseCollection<Persistable> = collectionName ? MeteorPersistence.collections[collectionName] : undefined;
        //    if (collection) {
        //        var rootValue = collection.getById(persistencePath.getId());
        //        var newValue = rootValue ? persistencePath.getSubObject(rootValue) : undefined;
        //        console.log("Lazy loading foreign key:" + s + " Loaded: ", newValue);
        //        return newValue;
        //    }
        //    else
        //        throw new Error("No collection found for lazy loading foreign key:" + s);
        //}

        static withCallback(p:Function,c:(error:any, result:any)=>void)
        {
            if( Meteor.isClient )
            {
                MeteorPersistence.nextCallback = c;
                p();
            }
            else
                throw new Error("'withCallback' only works on the client as it is called when the next wrapped meteor call returns" );
        }

        static wrapClass<T extends Persistable>(c:TypeClass<T>) {
            var className = persistence.PersistenceAnnotation.className(c);
            console.log("Wrapping transactional functions for class " + className);
            // iterate over all properties of the prototype. this is where the functions are.
            //var that = this;
            persistence.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var domainObjectFunction = c.prototype[functionName];
                // this is executed last. it wraps the original function into a collection.update
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {
                    var collection:persistence.BaseCollection<any> = persistence.MeteorPersistence.collections[persistence.PersistenceAnnotation.getCollectionName(c)];
                    if( MeteorPersistence.wrappedCallInProgress || Meteor.isServer )
                    {
                        return collection.update(this.getId(), function (o) {
                            return originalFunction.apply(o, args);
                        });

                    }
                    else
                        return originalFunction.apply(this, args);
                });
                // this is executed second. a meteor call is made for the objects that need updating
                MeteorPersistence.wrapFunction(c.prototype, functionName, className+"."+functionName, false, MeteorPersistence.serializer, MeteorPersistence.meteorObjectRetriever )
                //this is executed first. it check if the object is part of the persistence layer and only if it is it calls the functions below
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {

                    if( this.persistencePath ) {
                        originalFunction.apply(this,args);
                    }
                    else
                        domainObjectFunction.apply(this,args);
                });

                //var originalFunction:Function = <Function>c.prototype[functionName];
                //// replace the function with a wrapper function that either does a meteor call or call to the original
                //console.log("Wrapping transactional functions for class " + className + " function: " + functionName);
                //var f:any = function meteorCallWrapper() {
                //    var args = [];
                //    var callback;
                //    for( var i in arguments )
                //    {
                //        if( i==arguments.length-1 && typeof arguments[i]=="function" )
                //            callback = arguments[i];
                //        else
                //            args[i] = that.serializer.toDocument( arguments[i] );
                //    }
                //    // If this is object is part of persistence and no wrapped call is in progress ...
                //    if( this.persistencePath ) {
                //        // hello meteor
                //        console.log("Meteor call " + (<any>arguments).callee.functionName + " with arguments ", arguments, " path:", this.persistencePath+" registered callback:"+MeteorPersistence.nextCallback);
                //        var typeNames:Array<string> = [];
                //        for (var ai = 0; ai < args.length; ai++) {
                //            typeNames.push(MeteorPersistence.objectsClassName(args[ai]));
                //        }
                //        Meteor.call("wrappedCall", this.persistencePath.toString(), (<any>arguments).callee.functionName, args, typeNames, !!callback, callback || MeteorPersistence.nextCallback);
                //    }
                //    if( callback ) {
                //        args.push(function (err, result) {
                //
                //        });
                //    }
                //    // also call the method on the current object so that it reflects the update
                //    var result = (<any>arguments).callee.originalFunction.apply(this, args);
                //    MeteorPersistence.updatePersistencePaths(this);
                //    return result;
                //};
                //// this stores the old function on the wrapping one
                //f.originalFunction = originalFunction;
                //// this keeps the original method name accessible as the closure somehow cant access a loop iterator
                //f.functionName = functionName;
                //// set the wrapping function on the class
                //c.prototype[functionName] = f;
            });


            PersistenceAnnotation.getTypedPropertyNames(c).forEach(function (propertyName:string) {
                if (PersistenceAnnotation.isStoredAsForeignKeys(c, propertyName)) {
                    //console.log("On Class " + className + ": creating lazy loader for " + propertyName);
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
                            if (MeteorPersistence.needsLazyLoading(this, propertyName)) {
                                if (typeof v == "string") {
                                    v = MeteorPersistence.meteorObjectRetriever.getObject(v);
                                    this[propertyName] = v;
                                }
                                else  // TODO this could be improved so that it loads them when they are accessed rather than to load them all at once
                                {
                                    //console.log("Lazy loading array/map " + className + "." + propertyName);
                                    for( var i in v )
                                    {
                                        var ele = v[i];
                                        v[i] = MeteorPersistence.meteorObjectRetriever.getObject(ele);
                                    }
                                }
                            }
                            //console.log("Monkey patched getter "+propertyName+" returns ",v);
                            return v;
                        },
                        set: function (v:any) {
                            //console.log("Monkey patched setter " + propertyName + " v:" + v);

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
                    console.log("On Class " + className + ": no lazy loader for " + propertyName);

            });
        }

        static needsLazyLoading(object:Persistable, propertyName:string) {
            // TODO inheritance
            var oc = PersistenceAnnotation.getClass(object);
            if( persistence.PersistenceAnnotation.isStoredAsForeignKeys(oc, propertyName ) )
            {
                var shadowpropertyDescriptor = Object.getOwnPropertyDescriptor(object, "_" + propertyName);
                var shadowPropertyIsKeys = false;
                if (shadowpropertyDescriptor)
                    if (typeof object["_" + propertyName] == "string")
                        shadowPropertyIsKeys = true;
                    else if (persistence.PersistenceAnnotation.isArrayOrMap(oc, propertyName)) {
                        var v = object["_" + propertyName];
                        for( var i in v )
                        {
                            if(typeof v[i] =="string" )
                                shadowPropertyIsKeys = true;
                            break;

                        }
                    }
                return shadowPropertyIsKeys;
            }
            else
                return false;

        }
        // todo  make the persistencePath enumerable:false everywhere it is set
        // static setPersistencePath(){
        //
        //}

        static updatePersistencePaths(object:Persistable, visited?:Array<Persistable>):void {
            if (!visited)
                visited = [];
            if (visited.indexOf(object) != -1)
                return;
            if( !object || typeof object!="object" )
                return;

            //console.log("updating persistence path for ", object)
            if (!Object.getOwnPropertyDescriptor(object, "persistencePath")) {
                Object.defineProperty(object, "persistencePath", {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            visited.push(object);
            var objectClass = PersistenceAnnotation.getClass(object);
            if (PersistenceAnnotation.isRootEntity(objectClass)) {
                if (!object.persistencePath) {
                    if ( object.getId())
                        object.persistencePath = new persistence.PersistencePath(PersistenceAnnotation.getCollectionName(objectClass), object.getId())
                    else
                        throw new Error("Can not set the persistence path of root collection object without id. Class:" + PersistenceAnnotation.className(objectClass));
                }
            }
            else {
                if (!object.persistencePath)
                    throw new Error("Can not set the persistence path of non root collection object. " + PersistenceAnnotation.className(objectClass));
            }
            PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
                if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName);
                    var v:Persistable = object[typedPropertyName];
                    if (v) {
                        if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                            //console.log("updating foreignkey property " + typedPropertyName + " is array");
                            for (var i in v) {
                                var e = v[i];
                                //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                                if (e.getId && e.getId()) {
                                    e.persistencePath = object.persistencePath.clone();
                                    e.persistencePath.appendArrayOrMapLookup(typedPropertyName, e.getId());
                                    MeteorPersistence.updatePersistencePaths(e, visited);
                                }
                                else
                                    throw new Error("An element of the array '" + typedPropertyName + "' stored on the classe " + PersistenceAnnotation.className(objectClass) + " does not have an id. Total persistence path so far:" + object.persistencePath.toString());
                            }
                        }
                        else {
                            //console.log("updating foreignkey property direct property " + typedPropertyName);

                            v.persistencePath = object.persistencePath.clone();
                            v.persistencePath.appendPropertyLookup(typedPropertyName);
                            MeteorPersistence.updatePersistencePaths(v, visited);
                        }
                    }

                }
                else {
                    //console.log( "foreign key "+typedPropertyName );
                    if (!MeteorPersistence.needsLazyLoading(object, typedPropertyName)) {
                        var v:Persistable = object[typedPropertyName];
                        if (v) {
                            if (PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                                for (var i in v) {
                                    var e = v[i];
                                    if (!e.persistencePath) {
                                        //console.log("non- foreign key array/map entry key:"+i+" value:"+e);
                                        MeteorPersistence.updatePersistencePaths(e, visited);
                                    }
                                }
                            }
                            else if (!v.persistencePath)
                                MeteorPersistence.updatePersistencePaths(v, visited);
                        }
                    }
                }
            });
        }

        static wrapFunction( object:any, propertyName:string, meteorMethodName:string, serverOnly:boolean, argumentSerializer:DeSerializer.Serializer, objectRetriever:ObjectRetriever ):void
        {
            var originalFunction = object[propertyName];
            if( Meteor.isClient ) {
                MeteorPersistence.monkeyPatch(object, propertyName, function (patchedFunction:Function, ...originalArguments:any[]) {
                    var args = [];
                    var classNames = [];
                    var callback;
                    for (var i in originalArguments) {
                        if (i == originalArguments.length - 1 && typeof originalArguments[i] == "function")
                            callback = originalArguments[i];
                        else if( originalArguments[i].persistencePath )
                        {
                            args[i] = originalArguments[i].persistencePath.toString();
                            classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                        }
                        else if (argumentSerializer)
                        {
                            args[i] = argumentSerializer ? argumentSerializer.toDocument(originalArguments[i]) : originalArguments[i];
                            classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                        }
                        else
                        {
                            args[i] = originalArguments[i];
                        }
                    }

                    var id = objectRetriever.getId(this);

                    // If this is object is part of persistence and no wrapped call is in progress ...
                    console.log("Meteor call " + propertyName + " with arguments ", originalArguments, " registered callback:" + MeteorPersistence.nextCallback);
                    Meteor.call(meteorMethodName, id, args, classNames, !!callback, function (error, result) {
                        console.log("Returned from meteor method '" + meteorMethodName + "' with result:", result, "_", callback,"_",MeteorPersistence.nextCallback);
                        if (!error) {
                            if (argumentSerializer && result.className) {
                                result.result = argumentSerializer.toObject(result.result, persistence.PersistenceAnnotation.getEntityClassByName(result.className));
                                MeteorPersistence.updatePersistencePaths(result.result);
                            }

                        }
                        if (callback)
                            callback(error, result ? result.result : undefined);
                        else if (MeteorPersistence.nextCallback) {
                            MeteorPersistence.nextCallback(error, result ? result.result : undefined);
                            MeteorPersistence.nextCallback = undefined;
                        }
                    });

                    // BUG if the method contains a callback it is called twice due to the code below
                    //sdfasdf
                    //// the object needs to be updated with the result form the update function
                    //if (!serverOnly) {
                    //    // also call the method on the current object so that it reflects the update
                    //    var result = patchedFunction.apply(this, originalArguments);
                    //    return result;
                    //}
                });
            }
            if( !serverOnly || Meteor.isServer ) {
                var m = {};
                m[meteorMethodName] = function (id:string, args:any[], classNames:string[], appendCallback:boolean) {
                    check(id, String);
                    check(args, Array);
                    check(classNames, Array);
                    console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
                    persistence.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object = objectRetriever.getObject(id);
                        if( !object )
                            throw new Error("Unable to retrieve object with id: "+id);
                        if (argumentSerializer) {
                            args.forEach(function (o:any, i:number) {
                                var argumentClass = persistence.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                                if( argumentClass )
                                {
                                    if( typeof o =="string" )
                                        args[i] = objectRetriever.getObject(o);
                                    else
                                        args[i] = argumentSerializer.toObject(o, argumentClass);
                                }

                            });
                        }

                        var resultObj:any = {};
                        if (appendCallback) {
                            console.log(" Meteor method call. Calling function with callback on ", object);
                            var syncFunction = Meteor.wrapAsync(function (cb) {
                                args.push(cb);
                                originalFunction.apply(object, args);
                            });
                            resultObj.result = syncFunction();
                        }
                        else {
                            console.log("Meteor method call. Calling function without callback");
                            resultObj.result = originalFunction.apply(object, args);
                        }
                        if( argumentSerializer )
                            resultObj.className = argumentSerializer.getClassName(resultObj.result);

                        console.log("Returning from meteor method '"+meteorMethodName+"' with result:", resultObj);

                        return resultObj;
                    } finally {
                        persistence.MeteorPersistence.wrappedCallInProgress = false;
                    }

                };
                Meteor.methods(m);
            }
        }

        static monkeyPatch( object:any, functionName:string, patchFunction:(original:Function, ...arg:any[])=>any) {
            var originalFunction = object[functionName];
            object[functionName] = function monkeyPatchFunction() {
                var args = [];
                args.push(originalFunction);
                for( var i in arguments ) {
                    args.push(arguments[i]);
                }
                return patchFunction.apply(this,args);
            };
        }
    }



}

//Meteor.methods({
//    wrappedCall:function( persistencePathString:string, functionName:string, args:Array<any>, typeNames:Array<string>, appendCallback:boolean )
//    {
//        // TODO authentication
//
//        console.log("meteor method: wrappedCall arguments: ", arguments, typeNames );
//        check(persistencePathString,String);
//        check(functionName, String);
//        check(args, Array);
//        check(typeNames, Array);
//        if( args.length!=typeNames.length )
//            throw new Error("array length does not match");
//
//        var persistencePath = new persistence.PersistencePath(persistencePathString);
//        for( var ai = 0; ai<args.length; ai++ )
//        {
//            if( persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) )
//            {
//                console.log("deserializing "+typeNames[ai] );
//                args[ai] = DeSerializer.Serializer.toObject(args[ai], persistence.PersistenceAnnotation.getEntityClassByName(typeNames[ai]) );
//            }
//        }
//        var collection:persistence.BaseCollection<any> = persistence.MeteorPersistence.collections[persistencePath.getClassName()];
//        try
//        {
//            persistence.MeteorPersistence.wrappedCallInProgress = true;
//            return collection.update( persistencePath.getId(), function( o ){
//                var subDocument:any = persistencePath.getSubObject( o );
//                var fkt = subDocument? subDocument[functionName]:undefined;
//                if (fkt && fkt.originalFunction)
//                    fkt = fkt.originalFunction;
//                if( subDocument && fkt )
//                {
//                    console.log("Meteor method call. Function name:"+functionName+" function: ",fkt, " appendCallback: ", appendCallback);
//
//                    if( appendCallback )
//                    {
//                        console.log(" Meteor method call. Calling function with callback on ",subDocument );
//                        var syncFunction = Meteor.wrapAsync(function(cb){
//                            args.push(cb);
//                            fkt.apply(subDocument, args);
//                        });
//                        var result = syncFunction();
//                        console.log("received async result from function ('"+functionName+"') invocation :"+result );
//                        return result;
//                    }
//                    else
//                    {
//                        console.log("Meteor method call. Calling function without callback" );
//                        return fkt.apply(subDocument, args);
//                    }
//                }
//                else
//                    console.log("did not find subdocument");
//            } );
//
//        }
//        finally
//        {
//            persistence.MeteorPersistence.wrappedCallInProgress = false;
//        }
//    }
//});
