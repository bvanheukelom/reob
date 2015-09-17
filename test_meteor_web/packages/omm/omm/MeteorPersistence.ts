///<reference path="../../../../typings/meteor/meteor.d.ts"/>
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="./Collection.ts"/>
///<reference path="./MeteorObjectRetriever.ts"/>
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

        static createMeteorMethod(options:IMethodOptions){
            var meteorMethodName:string = options.name;
            var isStatic = options.isStatic;
            var staticObject = options.object;
            var parameterClassNames = options.parameterTypes;
            var originalFunction = options.parentObject[options.functionName];
            if( Meteor.isServer || typeof options.serverOnly == "undefined" || !options.serverOnly ) {
                var m = {};
                m[meteorMethodName] = function (...args:any[]) {
                    //console.log("Meteor method invoked: "+meteorMethodName+" id:"+id+" appendCallback:"+appendCallback+" args:", args, " classNames:"+classNames);
                    check(args, Array);
                    omm.MeteorPersistence.wrappedCallInProgress = true;
                    try {
                        var object;
                        if (!isStatic) {
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
                        if (callbackIndex != -1) {
                            var syncFunction = Meteor.wrapAsync(function (cb) {
                                args[callbackIndex] = cb;
                                originalFunction.apply(object, args);
                            });
                            result = syncFunction();
                        } else {
                            result = originalFunction.apply(object, args);
                        }

                        var doc:any = omm.MeteorPersistence.serializer.toDocument(result);
                        console.log("result of applied meteor method:",result);
                        if(Array.isArray(result)){
                            console.log("result of applied meteor method is array of length ", result.length);
                            for( var ri=0; ri<result.length; ri++ ){
                                var t:TypeClass<Object> = omm.PersistenceAnnotation.getClass(result[ri]);
                                console.log("result of applied meteor method is array and found type ",t);
                                if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t)))
                                    doc[ri].className = omm.className(t);
                            }
                        }else{
                            var t:TypeClass<Object> = omm.PersistenceAnnotation.getClass(result);
                            if (t && omm.className(t) && omm.PersistenceAnnotation.getEntityClassByName(omm.className(t)))
                                doc.className = omm.className(t);
                        }
                        console.log("MEteor method returns doc:",doc);
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