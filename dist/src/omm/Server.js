/**
 * Created by bert on 07.07.16.
 */
"use strict";
var omm = require("../omm");
var wm = require("@bvanheukelom/web-methods");
var Server = (function () {
    function Server(express) {
        this.collections = {};
        this.singletons = {};
        this.webMethods = new wm.WebMethods();
        this.serializer = new omm.Serializer();
        this.addAllWebMethods();
        this.registerGetter();
        this.webMethods.registerEndpoint(express);
    }
    Server.prototype.addCollection = function (c) {
        this.collections[c.getName()] = c;
    };
    Server.prototype.addSingleton = function (name, singleton) {
        this.singletons[name] = singleton;
        omm.SerializationPath.updateObjectContexts(singleton, this);
    };
    Server.prototype.addAllWebMethods = function () {
        var _this = this;
        console.log("adding web methods ");
        omm.PersistenceAnnotation.getAllMethodFunctionNames().forEach(function (functionName) {
            var options = omm.PersistenceAnnotation.getMethodOptions(functionName);
            console.log("Adding Web method " + options.name);
            _this.webMethods.add(options.name, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                console.log("Web method " + options.name);
                // the object id is the first parameter
                var objectId = args.shift();
                // the user Data is the second parameter
                var userData = args.shift();
                console.log("User data ", userData);
                // convert parameters given to the web method from documents to objects
                _this.convertWebMethodParameters(args, options.parameterTypes);
                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = _this.retrieveObject(objectId)
                    .then(function (object) {
                    // this might be the collection update or another function that is called directly
                    Server.userData = userData;
                    var r = object[options.propertyName].apply(object, args);
                    Server.userData = undefined;
                    return r;
                })
                    .then(function (result) {
                    var res = {};
                    if (result)
                        res.document = _this.serializer.toDocument(result, true);
                    console.log("Result of web method " + options.name + " is ", res);
                    return res;
                });
                // return the promise
                return p;
            });
        });
    };
    Server.prototype.retrieveObject = function (objectId) {
        var singleton = this.singletons[objectId];
        if (singleton)
            return Promise.resolve(singleton);
        else {
            if (typeof objectId != "string")
                throw new Error("Path needs to be a string");
            var sPath = new omm.SerializationPath(objectId);
            var collectionName = sPath.getCollectionName();
            var collection = collectionName ? this.collections[collectionName] : undefined;
            if (collection) {
                return collection.getById(sPath.getId()).then(function (o) {
                    return sPath.getSubObject(o);
                });
            }
            else
                return Promise.reject("No collection found to retrieve object. Key:" + objectId);
        }
    };
    Server.prototype.attachClassName = function (o) {
        var className = omm.className(o);
        if (className && omm.entityClasses[className]) {
            o.className = className;
        }
        if (o._serializationPath)
            o.serializationPath = o._serializationPath.toString();
    };
    Server.prototype.registerGetter = function () {
        var _this = this;
        this.webMethods.add("get", function (className, objectId) {
            console.log("Getter " + className, objectId);
            var type = omm.entityClasses[className];
            var collectionName = type ? omm.PersistenceAnnotation.getCollectionName(type) : undefined;
            var objPromise = collectionName ? _this.retrieveObject(collectionName + "[" + objectId + "]") : undefined;
            return objPromise.then(function (obj) {
                return obj ? _this.serializer.toDocument(obj) : undefined;
            });
        });
    };
    // converts parameters given to the web method from documents to objects
    Server.prototype.convertWebMethodParameters = function (args, classNames) {
        for (var i = 0; i < args.length; i++) {
            if (classNames && classNames.length > i) {
                var cls = omm.PersistenceAnnotation.getEntityClassByName(classNames[i]);
                if (cls) {
                    if (typeof args[i] == "string")
                        args[i] = this.retrieveObject(args[i]);
                    else if (typeof args[i] == "object")
                        args[i] = this.serializer.toObject(args[i], cls);
                }
            }
        }
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=Server.js.map