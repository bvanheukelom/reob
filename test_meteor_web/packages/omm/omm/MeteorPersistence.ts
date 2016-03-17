///<reference path="../../../../typings/meteor/meteor.d.ts"/>
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="./Collection.ts"/>
///<reference path="./Collection.ts"/>
///<reference path="./MeteorObjectRetriever.ts"/>



module omm {

    export var methodContext:any;



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
        //var className = omm.className(c);
        omm.PersistenceAnnotation.getMethodFunctionNames(c.prototype).forEach(function (functionName:string) {
            var methodOptions = omm.PersistenceAnnotation.getMethodOptions(functionName);
            helper[methodOptions.functionName] = function (...originalArguments:any[]) {
                var args = [];
                for (var i in originalArguments) {
                    if( (typeof originalArguments[i]=="object") && originalArguments[i] && originalArguments[i]._serializationPath) {
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
                    if( result )
                        result = omm.MeteorPersistence.serializer.toObject(result, callOptions.resultType?omm.entityClasses[callOptions.resultType]:undefined);
                    if( err && err instanceof Meteor.Error )
                        err = err.error;
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
                methodName = functionName;
            helper[methodOptions.functionName] = function(...originalArguments:any[] ){
                var args = [];
                for (var i in originalArguments) {
                    if ((typeof originalArguments[i]=="object") && originalArguments[i] && originalArguments[i]._serializationPath) {
                        args[i] = originalArguments[i]._serializationPath.toString();
                    }
                    else {
                        args[i] = omm.MeteorPersistence.serializer.toDocument(originalArguments[i]);
                    }
                }
                args.splice( 0, 0, methodName );
                args.push(function(err:any, result?:any){
                    if( result )
                        result = omm.MeteorPersistence.serializer.toObject(result, methodOptions.resultType?omm.entityClasses[methodOptions.resultType]:undefined);
                    if( err && err instanceof Meteor.Error )
                        err = err.error;
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
                    if( result )
                        result = omm.MeteorPersistence.serializer.toObject(result );
                    if( err && err instanceof Meteor.Error )
                        err = err.error;
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

        // this method registers a meteor method
        static createMeteorMethod(options:IMethodOptions){

            // here the options are converted into local variables for readablility
            var meteorMethodName:string = options.name;
            var isStatic = options.isStatic;
            var staticObject = options.object;
            var parameterClassNames = options.parameterTypes;
            var originalFunction = options.parentObject[options.functionName];

            // methods are only created on the server if that was specified
            if( Meteor.isServer || typeof options.serverOnly == "undefined" || !options.serverOnly ) {
                var m = {};
                m[meteorMethodName] = function (...args:any[]) {
                    omm.methodContext = this;
                    //console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
                    check(args, Array);
                    omm.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object;
                        if (!isStatic) {
                            if (!staticObject) {
                                if (args.length == 0)
                                    throw new Error('Error calling meteor method ' + meteorMethodName + ': id or static object required');
                                var id:string = args[0];
                                if (typeof id != "string")
                                    throw new Error('Error calling meteor method ' + meteorMethodName + ': id is not of type string.');
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
                                throw new Error( 'Error calling meteor method ' + meteorMethodName + ':Unable to retrieve object by id: ' + id );
                        }

                        // convert the parameters based on their defined types
                        var callbackIndex = -1;
                        for (var i = 0; i < args.length; i++) {
                            if (parameterClassNames && parameterClassNames.length > i) {
                                var cls = omm.PersistenceAnnotation.getEntityClassByName(parameterClassNames[i]);
                                if (cls) {
                                    if (typeof args[i] == "string")
                                        args[i] = omm.MeteorPersistence.meteorObjectRetriever.getObject(args[i]);
                                    else if (typeof args[i] == "object")
                                        args[i] = omm.MeteorPersistence.serializer.toObject(args[i], cls);
                                } else if (parameterClassNames[i] == "callback")
                                    callbackIndex = i;
                            }
                        }

                        // CALLING THE ORIGINAL FUNCTION
                        var result;
                        var theError:any = undefined;
                        try {
                            if (callbackIndex != -1) {
                                var syncFunction = Meteor.wrapAsync(function (ascb:(error:any, result:any)=>void) {
                                    args[callbackIndex] = function (error, result) {
                                        theError = error;
                                        ascb(error, result);
                                    };
                                    originalFunction.apply(object, args);
                                });
                                result = syncFunction();
                            } else {
                                result = originalFunction.apply(object, args);
                            }
                        }catch( e ){
                            if( !theError )
                                theError = e;
                        }
                        if( !theError ) {
                            // converting the result into a doc
                            var doc:any = omm.MeteorPersistence.serializer.toDocument(result);
                            //console.log("result of applied meteor method:",result);
                            if (Array.isArray(result)) {
                                //console.log("result of applied meteor method is array of length ", result.length);
                                for (var ri = 0; ri < result.length; ri++) {
                                    var t:TypeClass<Object> = omm.PersistenceAnnotation.getClass(result[ri]);
                                    //console.log("result of applied meteor method is array and found type ",t);
                                    if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t)))
                                        doc[ri].className = omm.className(t);
                                }
                            } else {

                                var t:TypeClass<Object> = omm.PersistenceAnnotation.getClass(result);
                                if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t))) {
                                    doc.className = omm.className(t);
                                }
                            }
                            //console.log("Meteor method returns doc:",doc);
                        }

                        // meteor methods never have callbacks. If needed just throw a Meteor.Error.
                        if( theError ){
                            if( !(theError instanceof Meteor.Error) )
                                theError = new Meteor.Error( theError );
                            throw theError;
                        }else
                            return doc;
                    } finally {
                        omm.MeteorPersistence.wrappedCallInProgress = false;
                    }
                };
                Meteor.methods(m);
            }
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
                            if( error && error instanceof Meteor.Error )
                                error = error.error;
                            if (cb)
                                cb(error, result);
                        });
                        args = args.concat(a);
                        omm.call.apply(undefined, args);
                    }
                    else{
                        // in this case we pretend we're not there
                        return originalFunction.apply(this, a);
                    }
                });
            }
        }

        /**
         * This patches the functions that are collection updates.
         * It also emits update events: pre:<FunctionName> post:<FunctionName>.
         * @param c
         */
        static wrapClass<T extends Object>(entityClass:TypeClass<T>) {

            //var className = omm.className(c);
            var that = this;
            omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(entityClass).forEach(function(functionName:string){
                MeteorPersistence.monkeyPatch(entityClass.prototype, functionName, function (originalFunction, ...args:string[]) {
                    //console.log("updating object:",this, "original function :"+originalFunction);
                    var _serializationPath:omm.SerializationPath = this._serializationPath;
                    var updateCollection:boolean = true;
                    var resetUpdateCollection:boolean = false;

                    if( !MeteorPersistence.updateInProgress  ) {
                        // make sure only one update process happens at the same time
                        omm.MeteorPersistence.updateInProgress = true;

                        // empty the queue so that it can hold the events that happen during an update
                        omm.resetQueue();
                        resetUpdateCollection = true;
                    } else {
                        updateCollection = false;
                    }

                    var rootObject;
                    var object;
                    var collection:omm.Collection<any>;
                    if( _serializationPath ) {
                        // get the responsible collection
                        collection = omm.MeteorPersistence.collections[_serializationPath.getCollectionName()];
                        // load the object or use the 'this' object if its a standard call
                        rootObject = collection.getById(_serializationPath.getId());
                        object =_serializationPath.getSubObject(rootObject);
                    } else {
                        rootObject = this;
                        object = this;
                        updateCollection = false;
                    }

                    // create the event context
                    var ctx = new omm.EventContext( object, collection );
                    ctx.methodContext = omm.methodContext;
                    ctx.functionName = functionName;
                    ctx.serializationPath = _serializationPath;
                    ctx.rootObject = rootObject;

                    // emit the pre-event
                    omm.callEventListeners( entityClass, "pre:"+functionName, ctx );
                    omm.callEventListeners( entityClass, "pre", ctx );

                    var preUpdateObject = object;

                    if( ctx.cancelledWithError() ){
                        if( resetUpdateCollection ) {
                            omm.MeteorPersistence.updateInProgress = false;
                            throw ctx.cancelledWithError();
                        }
                    } else {
                        var result;
                        if( updateCollection ) {
                            result = collection.update(_serializationPath.getId(), function (o) {
                                var subObject = _serializationPath.getSubObject(o);
                                var r2 = originalFunction.apply(subObject, args);
                                return r2;
                            });
                        } else {
                            result = originalFunction.apply(this, args);
                        }
                        if( resetUpdateCollection ){
                            omm.MeteorPersistence.updateInProgress = false;
                        }

                        // TODO this might potentially catch updates of something that happened between the update and now. Small timeframe but still relevant. Also the extra load should be avoided.


                        if( updateCollection ){
                            rootObject = collection.getById(_serializationPath.getId());
                            object =_serializationPath.getSubObject(rootObject);
                        }

                        var ctx = new omm.EventContext( object, collection );
                        ctx.preUpdate = preUpdateObject;
                        ctx.methodContext = omm.methodContext;
                        ctx.functionName = functionName;
                        ctx.serializationPath = _serializationPath;
                        ctx.rootObject = rootObject;
                        //ctx.ob


                        if( omm._queue ){
                            omm._queue.forEach(function(t){
                                //console.log( 'emitting event:'+t.topic );
                                omm.callEventListeners( entityClass, t.topic, ctx, t.data );
                            });
                        }

                        omm.callEventListeners( entityClass, "post:"+functionName, ctx );
                        omm.callEventListeners( entityClass, "post", ctx );
                        if( resetUpdateCollection ){
                            omm.deleteQueue();
                        }
                        return result;
                    }
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