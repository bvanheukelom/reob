///<reference path="../../../../typings/meteor/meteor.d.ts"/>
module omm {

    export class MeteorPersistence {
        static classes:{[index:string]:{ new(): Persistable ;}} = {};
        static collections:{[index:string]:omm.BaseCollection<any>} = {};
        static wrappedCallInProgress = false;
        static nextCallback;
        private static initialized = false;
        private static meteorObjectRetriever;
        private static serializer;

        static init() {
            if (!MeteorPersistence.initialized) {
                MeteorPersistence.meteorObjectRetriever = new omm.MeteorObjectRetriever();
                MeteorPersistence.serializer = new omm.Serializer( MeteorPersistence.meteorObjectRetriever );
                Serializer.init();
                omm.PersistenceAnnotation.getEntityClasses().forEach(function (c:TypeClass<Persistable>) {
                    MeteorPersistence.wrapClass(c);
                });
                MeteorPersistence.initialized = true;
            }
        }

        // TODO new name
        static objectsClassName(o:any):string {
            return omm.className(o.constructor);
        }


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
            var className = omm.className(c);
            console.log("Wrapping transactional functions for class " + className);
            // iterate over all properties of the prototype. this is where the functions are.
            //var that = this;
            omm.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var domainObjectFunction = c.prototype[functionName];
                // this is executed last. it wraps the original function into a collection.update
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {
                    console.log("updating object:",this, "original function :"+originalFunction);
                    var _serializationPath:omm.SerializationPath = this._serializationPath;
                    var collection:omm.BaseCollection<any> = omm.MeteorPersistence.collections[_serializationPath.getCollectionName()];
                    if( MeteorPersistence.wrappedCallInProgress || Meteor.isServer )
                    {
                        var result = collection.update(_serializationPath.getId(), function (o) {
                            var subObject = _serializationPath.getSubObject(o);
                            var r2 =  originalFunction.apply(subObject, args);
                            console.log("called original function with result :",r2);
                            return r2;
                        });
                        console.log("Result of verified update :"+result );
                        return result;

                    }
                    else
                    {
                        var r = originalFunction.apply(this, args);
                        console.log("Result of simple function call :"+r );
                        return r

                    }
                });
                // this is executed second. a meteor call is made for the objects that need updating
                MeteorPersistence.wrapFunction(c.prototype, functionName, className+"."+functionName, false, MeteorPersistence.serializer, MeteorPersistence.meteorObjectRetriever )
                //this is executed first. it check if the object is part of the persistence layer and only if it is it calls the functions below
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {

                    if( this._serializationPath && !MeteorPersistence.wrappedCallInProgress ) {
                        originalFunction.apply(this,args);
                    }
                    else
                        return domainObjectFunction.apply(this,args);
                });

            });


        }


        // todo  make the persistencePath enumerable:false everywhere it is set


        static wrapFunction( object:any, propertyName:string, meteorMethodName:string, serverOnly:boolean, argumentSerializer:omm.Serializer, objectRetriever:ObjectRetriever ):void
        {
            var originalFunction = object[propertyName];
            if( Meteor.isClient ) {
                MeteorPersistence.monkeyPatch(object, propertyName, function (patchedFunction:Function, ...originalArguments:any[]) {
                    if( MeteorPersistence.wrappedCallInProgress ){
                        patchedFunction.apply(this,originalArguments);
                    } else {

                        var args = [];
                        var classNames = [];
                        var callback;
                        for (var i in originalArguments) {
                            if (i == originalArguments.length - 1 && typeof originalArguments[i] == "function")
                                callback = originalArguments[i];
                            else if (originalArguments[i]._serializationPath) {
                                args[i] = originalArguments[i]._serializationPath.toString();
                                classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                            }
                            else if (argumentSerializer) {
                                args[i] = argumentSerializer ? argumentSerializer.toDocument(originalArguments[i]) : originalArguments[i];
                                classNames[i] = argumentSerializer.getClassName(originalArguments[i]);
                            }
                            else {
                                args[i] = originalArguments[i];
                            }
                        }

                        var id = objectRetriever.getId(this);

                        // If this is object is part of persistence and no wrapped call is in progress ...
                        console.log("Meteor call " + propertyName + " with arguments ", originalArguments, " registered callback:" + MeteorPersistence.nextCallback);
                        Meteor.call(meteorMethodName, id, args, classNames, !!callback, function (error, result) {
                            console.log("Returned from meteor method '" + meteorMethodName + "' with result:", result, "_", callback, "_", MeteorPersistence.nextCallback);
                            if (!error) {
                                if (argumentSerializer && result.className) {
                                    var resultClass = omm.PersistenceAnnotation.getEntityClassByName(result.className);
                                    if(resultClass)
                                        result.result = argumentSerializer.toObject(result.result, resultClass);
                                }

                            }
                            if (callback) {
                                console.log("calling model callback");
                                callback(error, result ? result.result : undefined);
                            } else if (MeteorPersistence.nextCallback) {
                                console.log("calling WithCallback-callback");
                                var cb = MeteorPersistence.nextCallback;
                                MeteorPersistence.nextCallback = undefined;
                                cb(error, result ? result.result : undefined);
                            }
                        });
                    }
                });
            }
            if( !serverOnly || Meteor.isServer ) {
                var m = {};
                m[meteorMethodName] = function (id:string, args:any[], classNames:string[], appendCallback:boolean) {
                    console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
                    check(id, String);
                    check(args, Array);
                    check(classNames, Array);
                    check(appendCallback, Boolean);
                    omm.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object = objectRetriever.getObject(id);
                        if( !object )
                            throw new Error("Unable to retrieve object with id: "+id);
                        if (argumentSerializer) {
                            args.forEach(function (o:any, i:number) {
                                var argumentClass = omm.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                                if( argumentClass )
                                {
                                    if( typeof o =="string" )
                                        args[i] = argumentSerializer.objectRetriever.getObject(o);
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
                        if( argumentSerializer ){
                            resultObj.className = argumentSerializer.getClassName(resultObj.result);
                            if( omm.PersistenceAnnotation.getClass( resultObj.result ) )
                                resultObj.result = argumentSerializer.toDocument(resultObj.result);
                        }

                        console.log("Returning from meteor method '"+meteorMethodName+"' with result:", resultObj);

                        return resultObj;
                    } finally {
                        omm.MeteorPersistence.wrappedCallInProgress = false;
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

Meteor.startup(function(){
    omm.MeteorPersistence.init();
});