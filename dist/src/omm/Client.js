/**
 * Created by bert on 07.07.16.
 */
"use strict";
var omm = require("../omm");
var wm = require("@bvanheukelom/web-methods");
var jsd = require("jsondiffpatch");
var Client = (function () {
    function Client(host, port, network) {
        this.singletons = {};
        if (!omm.MeteorPersistence.isInitialized())
            throw new Error("omm is not initialized.");
        var endpointUrl = "http://" + host + ":" + port + "/methods";
        this.webMethods = new wm.WebMethods(endpointUrl);
        this.serializer = new omm.Serializer();
        this.network = network;
    }
    Client.prototype.addSingleton = function (name, singleton) {
        this.singletons[name] = singleton;
        omm.SerializationPath.setObjectContext(singleton, undefined, this);
    };
    Client.prototype.load = function (clsOrString, id) {
        var _this = this;
        var collectionName = clsOrString;
        if (typeof clsOrString != "string")
            collectionName = omm.className(clsOrString);
        return this.webMethods.call("get", collectionName, id).then(function (result) {
            var document = result.document;
            var serializationPath = new omm.SerializationPath(result.serializationPath);
            var className = result.className;
            var o = _this.serializer.toObject(document, _this, omm.PersistenceAnnotation.getEntityClassByName(className), serializationPath);
            return o;
        });
    };
    Client.prototype.loadDocument = function (clsOrString, id) {
        var collectionName = clsOrString;
        if (typeof clsOrString != "string")
            collectionName = omm.className(clsOrString);
        return this.webMethods.call("get", collectionName, id).then(function (result) {
            var document = result.document;
            // var serializationPath = new omm.SerializationPath(result.serializationPath);
            // var className = result.className;
            // var o = this.serializer.toObject( document,  this, omm.PersistenceAnnotation.getEntityClassByName(className), serializationPath );
            return document;
        });
    };
    Client.prototype.call = function (methodName, objectId, args) {
        var _this = this;
        console.log("Call web method " + methodName, objectId, args);
        var webArgs = [];
        // convert the arguments to their origin
        for (var i in args) {
            if (args[i]._serializationPath) {
                webArgs[i] = args[i]._serializationPath.toString();
            }
            else if (typeof args[i] != "function") {
                webArgs[i] = this.serializer.toDocument(args[i]);
            }
            else {
                throw new Error("There can not be parameters of type 'function' in the arguments when calling a web method with name " + methodName);
            }
        }
        // prepend
        webArgs.unshift(this.userData);
        webArgs.unshift(objectId);
        webArgs.unshift(methodName);
        var p = this.webMethods.call.apply(this.webMethods, webArgs);
        return p.then(function (result) {
            console.log("web method returned ", result);
            // convert the result from json to an object
            var obje;
            if (result) {
                obje = _this.serializer.toObject(result.document, _this);
            }
            return obje;
        });
    };
    Client.prototype.getSingletonKey = function (o) {
        for (var i in this.singletons) {
            if (this.singletons[i] == o)
                return i;
        }
        return undefined;
    };
    Client.prototype.webMethod = function (entityClass, functionName, object, originalFunction, args) {
        if (!Client.webMethodRunning) {
            Client.webMethodRunning = true;
            try {
                console.log("On the client, running webMethod:" + functionName);
                var sp = object._ommObjectContext.serializationPath ? object._ommObjectContext.serializationPath : undefined;
                var key = this.getSingletonKey(object) || (sp ? sp.toString() : undefined);
                var r;
                var options = omm.PersistenceAnnotation.getMethodOptions(functionName);
                if (key) {
                    r = this.call(options.name, key, args);
                }
                if (!options.serverOnly || !key) {
                    console.log("Running original function of web method " + options.name);
                    var rOriginal = originalFunction.apply(object, args);
                    if (!r)
                        r = rOriginal;
                    omm.SerializationPath.updateObjectContexts(object, this);
                }
                return r;
            }
            catch (e) {
                console.log("Error running client side function for web method " + functionName + ". ", e);
            }
            finally {
                Client.webMethodRunning = false;
            }
        }
        else {
            console.log("webmethod already running");
        }
    };
    Client.prototype.setUserData = function (ud) {
        this.userData = ud;
    };
    Client.webMethodRunning = false;
    return Client;
}());
exports.Client = Client;
// web method handler on the client side?
// patch the objects function to call the web method
// MeteorPersistence.monkeyPatch(options.parentObject, options.name, function (originalFunction, ...a:any[]) {
//
// }); 
//# sourceMappingURL=Client.js.map