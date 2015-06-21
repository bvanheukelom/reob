///<reference path="../../../../typings/meteor/meteor.d.ts"/>
module omm {

    export class CallHelper<T extends Object>{
        object:T;
        callback:(error:any, result?:any)=>void;
        constructor( o, cb?:(error:any, result?:any)=>void ){
            this.object = o;
            this.callback = cb;
        }
    }

    export function registerObject<O extends Object>( key:string, o:O ){
        omm.registeredObjects[key] = o;
    }

    export function getRegisteredObject( key:string ):any{
        return omm.registeredObjects[key];
    }

    export function callHelper<O extends Object>(o:O, callback?:( err:any, result?:any)=>void ):O {
        var helper:any = {};
        var c = omm.PersistenceAnnotation.getClass(o);
        var className = omm.className(c);
        omm.PersistenceAnnotation.getMethodFunctionNames(c.prototype).forEach(function (functionName:string) {
            var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
            helper[methodOptions.functionName] = function (...originalArguments:any[]) {
                var args = [];
                for (var i in originalArguments) {
                    if (originalArguments[i]._serializationPath) {
                        args[i] = originalArguments[i]._serializationPath.toString();
                    }
                    else {
                        args[i] = omm.MeteorPersistence.serializer.toDocument(originalArguments[i]);
                    }
                }
                var callOptions:IMethodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
                if (!callOptions.object) {
                    var id = omm.MeteorPersistence.meteorObjectRetriever.getId(o);
                    args.splice(0, 0, id);
                }
                args.splice(0, 0, methodOptions.name);
                args.push(function (err:any, result?:any) {
                    if (result && result.className)
                        result = omm.MeteorPersistence.serializer.toObject(result);
                    if (callback)
                        callback(err, result);
                });
                Meteor.call.apply(this, args);
            }
        });
        return helper;
    }

    export function staticCallHelper<O extends Object>( tc:O, callback?:( err:any, result?:any)=>void ):O{
        // static functions
        var helper:any = {};
        var className = omm.className(<any>tc);
        omm.PersistenceAnnotation.getMethodFunctionNamesByObject(<any>tc).forEach(function(functionName:string) {
            var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
            var methodName = methodOptions.name;
            if( !methodName )
                methodName = className+"-"+functionName;
            helper[methodOptions.functionName] = function(...originalArguments:any[] ){
                var args = [];
                for (var i in originalArguments) {
                    if (originalArguments[i]._serializationPath) {
                        args[i] = originalArguments[i]._serializationPath.toString();
                    }
                    else {
                        args[i] = omm.MeteorPersistence.serializer.toDocument(originalArguments[i]);
                    }
                }
                args.splice( 0, 0, methodName );
                args.push(function(err:any, result?:any){
                    if( result && result.className )
                        result = omm.MeteorPersistence.serializer.toObject(result);
                    if( callback )
                        callback(err, result);
                });
                Meteor.call.apply(this, args);
            }
        });
        return helper;
    }

    export function call( meteorMethodName:string, ...args:any[] ){
            for (var i in args) {
                if (args[i]._serializationPath) {
                    args[i] = args[i]._serializationPath.toString();
                }
                else if(typeof args[i]!="function") {
                    args[i] = omm.MeteorPersistence.serializer.toDocument(args[i]);
                }
            }
            if( args.length>0 && (typeof args[args.length-1] == "function") ) {
                var orignalCallback:Function = args[args.length-1];
                args[args.length-1] = function(err:any, result?:any){
                    if( result && result.className )
                        result = omm.MeteorPersistence.serializer.toObject(result);
                    orignalCallback(err, result);
                };
            }
            args.splice(0,0,meteorMethodName);
            Meteor.call.apply(this, args);
    }

    export class MeteorPersistence {
        static collections:{[index:string]:omm.Collection<any>} = {};
        static wrappedCallInProgress = false;
        static updateInProgress = false;
        static nextCallback;
        private static initialized = false;
        static meteorObjectRetriever:omm.ObjectRetriever;
        static serializer:omm.Serializer;

        static init() {
            if (!MeteorPersistence.initialized) {
                MeteorPersistence.meteorObjectRetriever = new omm.MeteorObjectRetriever();
                MeteorPersistence.serializer = new omm.Serializer( MeteorPersistence.meteorObjectRetriever );
                Serializer.init();
                omm.PersistenceAnnotation.getEntityClasses().forEach(function (c:TypeClass<Object>) {
                    MeteorPersistence.wrapClass(c);
                });


                omm.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function(functionName:string){
                    var methodOptions:IMethodOptions = omm.PersistenceAnnotation.getMethodOptions( functionName );
                    omm.MeteorPersistence.createMeteorMethod(methodOptions);
                });


                MeteorPersistence.initialized = true;
            }
        }

        // TODO new name
        static objectsClassName(o:any):string {
            return omm.className(o.constructor);
        }


        //static withCallback(p:Function,c:(error:any, result:any)=>void)
        //{
        //    if( Meteor.isClient )
        //    {
        //        MeteorPersistence.nextCallback = c;
        //        p();
        //    }
        //    else
        //        throw new Error("'withCallback' only works on the client as it is called when the next wrapped meteor call returns" );
        //}

        static createMeteorMethod(options:IMethodOptions){
            var meteorMethodName:string = options.name;
            var isStatic = options.isStatic;
            var staticObject = options.object;
            var parameterClassNames = options.parameterTypes;
            var originalFunction = options.parentObject[options.functionName];
            var m = {};
            m[meteorMethodName] = function ( ...args:any[] ) {
                //console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
                check(args, Array);
                omm.MeteorPersistence.wrappedCallInProgress = true;
                try {
                    var object;
                    if( !isStatic ) {
                        if (!staticObject) {
                            if (args.length == 0)
                                throw new Error("An omm crated meteor method requires an id if no static object is given");
                            var id:string = args[0];
                            if (typeof id != "string")
                                throw new Error('Error calling meteor method ' + meteorMethodName + ': Id is not of type string.');
                            if (options.parentObject && options.parentObject.constructor) {
                                var className = omm.className(<any>options.parentObject.constructor);
                                if (omm.PersistenceAnnotation.getEntityClassByName(className) && id.indexOf("[") == -1)
                                    id = className + "[" + id + "]";
                            }
                            object = omm.MeteorPersistence.meteorObjectRetriever.getObject(id);
                            args.splice(0, 1);
                        } else {
                            if (typeof staticObject == "string")
                                object = omm.getRegisteredObject(<string>staticObject);
                            else
                                object = staticObject;
                        }
                        if (!object)
                            throw new Error("Unable to retrieve object by id: " + id);
                    }

                    var callbackIndex=-1;
                    for( var i=0; i<args.length; i++ ){
                        if( parameterClassNames && parameterClassNames.length>i ){
                            var cls = omm.PersistenceAnnotation.getEntityClassByName(parameterClassNames[i]);
                            if( cls ) {
                                if (typeof args[i] == "string")
                                    args[i] = omm.MeteorPersistence.meteorObjectRetriever.getObject(args[i]);
                                else if (typeof args[i] == "object")
                                    args[i] = omm.MeteorPersistence.serializer.toObject(args[i],cls);
                            }else if( parameterClassNames[i]=="callback" )
                                callbackIndex = i;
                        }
                    }

                    // CALLING THE ORIGINAL FUNCTION
                    var result;
                    if( callbackIndex!=-1 ){
                        var syncFunction = Meteor.wrapAsync(function (cb) {
                            args[callbackIndex] = cb;
                            originalFunction.apply(object, args);
                        });
                        result = syncFunction();
                    }else{
                        result = originalFunction.apply(object, args);
                    }

                    var doc:any = omm.MeteorPersistence.serializer.toDocument(result);
                    var t:TypeClass<Object> = omm.PersistenceAnnotation.getClass(result);
                    if( t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t)) )
                        doc.className = omm.className(t);
                    return doc;
                } finally {
                    omm.MeteorPersistence.wrappedCallInProgress = false;
                }
            };
            Meteor.methods(m);
            if( options.replaceWithCall ) {
                omm.MeteorPersistence.monkeyPatch(options.parentObject, options.functionName, function (originalFunction, ...a:any[]) {
                    if( !omm.MeteorPersistence.updateInProgress &&  (this._serializationPath || options.isStatic || (options.object && typeof options.object == "string") ) ) {
                        var args = [];
                        args.push(options.name);
                        if(!options.isStatic && !options.object ){
                            var id = omm.MeteorPersistence.meteorObjectRetriever.getId(this);
                            if (id)
                                args.push(id);
                        }

                        var callbackIndex=-1;
                        var cb:Function;
                        for( var i=0; i<a.length; i++ ){
                            if( parameterClassNames && parameterClassNames.length>i ){
                                if( parameterClassNames[i]=="callback" ){
                                    callbackIndex = 1;
                                    cb = a[i];
                                    a[i] = "OMM_CALLBACK_PLACEHOLDER";
                                }
                            }
                        }
                        a.push(function (error, result) {
                            if (cb)
                                cb(error, result);
                        });
                        args = args.concat(a);
                        omm.call.apply(undefined, args);
                    }
                    else{
                        // in this case we pretend we're not there
                        originalFunction.apply(this, a);
                    }
                });
            }
        }

        static wrapClass<T extends Object>(c:TypeClass<T>) {

            var className = omm.className(c);

            omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(c).forEach(function(functionName:string){
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {
                    //console.log("updating object:",this, "original function :"+originalFunction);
                    var _serializationPath:omm.SerializationPath = this._serializationPath;
                    if( !MeteorPersistence.updateInProgress && _serializationPath ) {
                        var collection:omm.Collection<any> = omm.MeteorPersistence.collections[_serializationPath.getCollectionName()];
                        omm.MeteorPersistence.updateInProgress = true;
                        var result = collection.update(_serializationPath.getId(), function (o) {
                            var subObject = _serializationPath.getSubObject(o);
                            var r2 =  originalFunction.apply(subObject, args);
                            return r2;
                        });
                        omm.MeteorPersistence.updateInProgress = false;
                        return result;
                    } else {
                        var r = originalFunction.apply(this, args);
                        return r;
                    }
                });
            });



            omm.PersistenceAnnotation.getWrappedFunctionNames(c).forEach(function (functionName) {
                var domainObjectFunction = c.prototype[functionName];
                // this is executed last. it wraps the original function into a collection.update
                MeteorPersistence.monkeyPatch(c.prototype, functionName, function (originalFunction, ...args:string[]) {
                    //console.log("updating object:",this, "original function :"+originalFunction);
                    var _serializationPath:omm.SerializationPath = this._serializationPath;
                    var collection:omm.Collection<any> = omm.MeteorPersistence.collections[_serializationPath.getCollectionName()];
                    if( MeteorPersistence.wrappedCallInProgress || Meteor.isServer ) {
                        var result = collection.update(_serializationPath.getId(), function (o) {
                            var subObject = _serializationPath.getSubObject(o);
                            var r2 =  originalFunction.apply(subObject, args);
                            //console.log("called original function with result :",r2);
                            return r2;
                        });
                        //console.log("Result of verified update :"+result );
                        return result;
                    }
                    else {
                        var r = originalFunction.apply(this, args);
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
        private static getClassName(o:Object):string {
            if( typeof o =="object" && omm.PersistenceAnnotation.getClass( o )) {
                return omm.className( omm.PersistenceAnnotation.getClass( o ) );
            }
            else
                return typeof o;
        }

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
                                classNames[i] = MeteorPersistence.getClassName(originalArguments[i]);
                            }
                            else if (argumentSerializer) {
                                args[i] = argumentSerializer ? argumentSerializer.toDocument(originalArguments[i]) : originalArguments[i];
                                classNames[i] = MeteorPersistence.getClassName(originalArguments[i]);
                            }
                            else {
                                args[i] = originalArguments[i];
                            }
                        }

                        var id = objectRetriever.getId(this);

                        // If this is object is part of persistence and no wrapped call is in progress ...
                        //console.log("Meteor call " + propertyName + " with arguments ", originalArguments, " registered callback:" + MeteorPersistence.nextCallback);
                        Meteor.call(meteorMethodName, id, args, classNames, !!callback, function (error, result) {
                            //console.log("Returned from meteor method '" + meteorMethodName + "' with result:", result, "_", callback, "_", MeteorPersistence.nextCallback);
                            if (!error) {
                                if (argumentSerializer && result.className) {
                                    var resultClass = omm.PersistenceAnnotation.getEntityClassByName(result.className);
                                    if(resultClass)
                                        result.result = argumentSerializer.toObject(result.result, resultClass);
                                }

                            }
                            if (callback) {
                                //console.log("calling model callback");
                                callback(error, result ? result.result : undefined);
                            } else if (MeteorPersistence.nextCallback) {
                                //console.log("calling WithCallback-callback");
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
                    //console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
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
                                        args[i] = MeteorPersistence.meteorObjectRetriever.getObject(o);
                                    else
                                        args[i] = argumentSerializer.toObject(o, argumentClass);
                                }

                            });
                        }

                        var resultObj:any = {};
                        if (appendCallback) {
                            //console.log(" Meteor method call. Calling function with callback on ", object);
                            var syncFunction = Meteor.wrapAsync(function (cb) {
                                args.push(cb);
                                originalFunction.apply(object, args);
                            });
                            resultObj.result = syncFunction();
                        }
                        else {
                            //console.log("Meteor method call. Calling function without callback");
                            resultObj.result = originalFunction.apply(object, args);
                        }
                        if( argumentSerializer ){
                            resultObj.className = MeteorPersistence.getClassName(resultObj.result);
                            if( omm.PersistenceAnnotation.getClass( resultObj.result ) )
                                resultObj.result = argumentSerializer.toDocument(resultObj.result);
                        }

                        //console.log("Returning from meteor method '"+meteorMethodName+"' with result:", resultObj);

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