/**
 * Created by bert on 07.07.16.
 */
"use strict";
const omm = require("../omm");
const wm = require("@bvanheukelom/web-methods");
class Client {
    constructor(host, port) {
        this.singletons = {};
        if (!omm.MeteorPersistence.isInitialized())
            throw new Error("omm is not initialized.");
        var endpointUrl = "http://" + host + ":" + port + "/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new omm.Serializer();
    }
    addSingleton(name, singleton) {
        this.singletons[name] = singleton;
        omm.SerializationPath.setObjectContext(singleton, undefined, this);
    }
    load(cls, id) {
        if (!omm.PersistenceAnnotation.isRootEntity(cls)) {
            throw new Error("Given class is not a root entity");
        }
        var className = omm.className(cls);
        return this.webMethods.call("get", className, id).then((doc) => {
            var o = this.serializer.toObject(doc, cls, this);
            // var collectionName = omm.PersistenceAnnotation.getCollectionName(cls);
            // var sp = new omm.SerializationPath( collectionName, id );
            omm.SerializationPath.updateObjectContexts(o, this);
            return o;
        });
    }
    call(methodName, objectId, args) {
        console.log("Call web method " + methodName, objectId, args);
        // convert the arguments to their origin
        for (var i in args) {
            if (args[i]._serializationPath) {
                args[i] = args[i]._serializationPath.toString();
            }
            else if (typeof args[i] != "function") {
                args[i] = this.serializer.toDocument(args[i]);
            }
        }
        // prepend
        args.unshift(objectId);
        args.unshift(methodName);
        debugger;
        var p = this.webMethods.call.apply(this.webMethods, args);
        return p.then((result) => {
            console.log("web method returned " + result);
            // convert the result from json to an object
            if (result) {
                var serializationPath = result.serializationPath;
                if (result.className) {
                    result = this.serializer.toObject(result);
                    if (serializationPath) {
                        omm.setNonEnumerableProperty(result, "_serializationPath", new omm.SerializationPath(serializationPath));
                    }
                }
            }
            return result;
        });
    }
    getSingletonKey(o) {
        for (var i in this.singletons) {
            if (this.singletons[i] == o)
                return i;
        }
        return undefined;
    }
    webMethod(entityClass, functionName, object, originalFunction, args) {
        debugger;
        console.log("On the client, running webMethod:" + functionName);
        var sp = object._ommObjectContext.serializationPath ? object._ommObjectContext.serializationPath : undefined;
        var key = this.getSingletonKey(object) || (sp ? sp.toString() : undefined);
        var r;
        var options = omm.PersistenceAnnotation.getMethodOptions(functionName);
        if (!options.serverOnly || !key) {
            console.log("Running original function of web method " + options.name);
            r = originalFunction.apply(object, args);
        }
        if (key) {
            r = this.call(options.name, key, args);
        }
        return r;
    }
    setUserData(ud) {
    }
}
exports.Client = Client;
// web method handler on the client side?
// patch the objects function to call the web method
// MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction, ...a:any[]) {
//
// }); 
//# sourceMappingURL=Client.js.map