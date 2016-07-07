/**
 * Created by bert on 07.07.16.
 */
"use strict";
const omm = require("../omm");
const wm = require("@bvanheukelom/web-methods");
class Server {
    constructor() {
        this.collections = {};
        this.singletons = {};
        this.webMethods = new wm.WebMethods();
        this.serializer = new omm.Serializer();
        this.addAllWebMethods();
        this.registerGetter();
    }
    addCollection(c) {
        this.collections[c.getName()] = c;
    }
    addSingleton(name, singleton) {
        this.singletons[name] = singleton;
        omm.SerializationPath.updateObjectContexts(singleton, this);
    }
    addAllWebMethods() {
        console.log("adding web methods ");
        omm.PersistenceAnnotation.getAllMethodFunctionNames().forEach((functionName) => {
            var options = omm.PersistenceAnnotation.getMethodOptions(functionName);
            console.log("Adding Web method " + options.name);
            this.webMethods.add(options.name, (...args) => {
                console.log("Web method " + options.name);
                // the object id is the first parameter
                var objectId = args.shift();
                // convert parameters given to the web method from documents to objects
                this.convertWebMethodParameters(args, options.parameterTypes);
                // load object based on the object id. this could either be a registered object or an object form a collection
                var p = this.retrieveObject(objectId)
                    .then((object) => {
                    return object[options.name].originalFunction.apply(object, args);
                })
                    .then((result) => {
                    this.attachClassName(result);
                    var r = this.serializer.toDocument(result);
                    console.log("Result of web method " + options.name + " is ", r);
                    return r;
                });
                // return the promise
                return p;
            });
        });
    }
    start(expressOrPort) {
        return this.webMethods.start(expressOrPort);
    }
    retrieveObject(objectId) {
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
                return collection.getById(sPath.getId()).then((o) => {
                    return sPath.getSubObject(o);
                });
            }
            else
                Promise.reject("No collection found to retrieve object. Key:" + objectId);
        }
    }
    attachClassName(o) {
        var className = omm.className(o);
        if (className && omm.entityClasses[className]) {
            o.className = className;
        }
        if (o._serializationPath)
            o.serializationPath = o._serializationPath.toString();
    }
    createWebMethod(options) {
        console.log("Creating web methods ", options.name);
        this.webMethods.add(options.name, (...args) => {
            console.log("Web method " + options.name);
            // the object id is the first parameter
            var objectId = args.shift();
            // convert parameters given to the web method from documents to objects
            this.convertWebMethodParameters(args, options.parameterTypes);
            // load object based on the object id. this could either be a registered object or an object form a collection
            var p = this.retrieveObject(objectId)
                .then((object) => {
                return object[options.name].originalFunction.apply(object, args);
            })
                .then((result) => {
                this.attachClassName(result);
                var r = this.serializer.toDocument(result);
                console.log("Result of web method " + options.name + " is ", r);
                return r;
            });
            // return the promise
            return p;
        });
    }
    registerGetter() {
        this.webMethods.add("get", (className, objectId) => {
            console.log("Getter " + className, objectId);
            var type = omm.entityClasses[className];
            var collectionName = type ? omm.PersistenceAnnotation.getCollectionName(type) : undefined;
            var objPromise = collectionName ? this.retrieveObject(collectionName + "[" + objectId + "]") : undefined;
            return objPromise.then((obj) => {
                return obj ? this.serializer.toDocument(obj) : undefined;
            });
        });
    }
    // converts parameters given to the web method from documents to objects
    convertWebMethodParameters(args, classNames) {
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
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map