/// <reference path="./PersistenceDescriptor.ts" />
//interface PersistableObject
//{
//    getId():string;
//    toDocument?():Document;
//}
//interface PersistableClass extends Function
//{
//    persistenceDescriptor:PersistenceDescriptor;
//    collection?:BaseCollection;
//}
var PersistenceInfo = (function () {
    function PersistenceInfo() {
    }
    return PersistenceInfo;
})();
var BaseCollection = (function () {
    function BaseCollection(persistableClass) {
        this.toDocumentModifiers = [];
        this.meteorCollection = meteorCollection;
        Persistence.collections[meteorCollection._name] = this;
        this.documentToObjectFunction = documentToObject;
    }
    BaseCollection.prototype.getById = function (id) {
        var o = this.find({
            "_id": id
        });
        return o.length > 0 ? o[0] : undefined;
    };
    BaseCollection.prototype.find = function (findCriteria) {
        var documents = this.meteorCollection.find(findCriteria).fetch();
        var objects = [];
        for (var i = 0; i < documents.length; i++) {
            var document = documents[i];
            objects[i] = this.documentToObject(document);
        }
        return objects;
    };
    BaseCollection.prototype.documentToObject = function (doc) {
        var p = this.documentToObjectFunction(doc);
        p.persistenceInfo = new PersistenceInfo();
        p.persistenceInfo.path = new PersistencePath(this, p.getId());
        return p;
    };
    BaseCollection.prototype.update = function (id, updateFunction) {
        for (var i = 0; i < 10; i++) {
            var document = this.meteorCollection.findOne({
                _id: id
            });
            if (!document)
                return undefined;
            var currentSerial = document.serial;
            // call the update function
            var object = this.documentToObject(document);
            updateFunction(object);
            var documentToSave = Persistence.toDocument(object);
            documentToSave.serial = currentSerial + 1;
            // update the collection
            console.log("writing document ", document);
            var updatedDocumentCount = this.meteorCollection.update({
                _id: id,
                serial: currentSerial
            }, document);
            // verify that that went well
            if (updatedDocumentCount == 1)
                return object; // we're done
            else if (updatedDocumentCount > 1)
                throw new Meteor.Error(500, "verifiedUpdate should only update one document");
            else {
                console.log("rerunning verified update ");
            }
        }
        return undefined;
    };
    BaseCollection.prototype.insert = function (p) {
        if (!p.getId())
            throw new Error("Object has no Id");
        var doc = Persistence.toDocument(p);
        doc.serial = 0;
        this.meteorCollection.insert(doc);
    };
    BaseCollection.isSaving = false;
    return BaseCollection;
})();
var Persistence = (function () {
    function Persistence() {
    }
    // do not call this from a class. use "createDocument" instead
    Persistence.toDocument = function (object, excludedProperties) {
        var result;
        if (typeof object.toDocument == "function")
            result = object.toDocument();
        else
            result = Persistence.createDocument(object);
        return result;
    };
    Persistence.createDocument = function (object, excludedProperties) {
        var doc = {};
        for (var property in object) {
            if (excludedProperties && excludedProperties.indexOf(property) != -1) {
                //console.log("Skipping excluded property : " + property);
                continue;
            }
            if (object[property] !== undefined && property != "persistencePath") {
                // primitives
                if (typeof object[property] == "string" || typeof object[property] == "number" || typeof object[property] == "date" || typeof object[property] == "boolean")
                    doc[property] = object[property];
                else if (object[property] instanceof Array) {
                    doc[property] = [];
                    var arr = object[property];
                    for (var i = 0; i < arr.length; i++) {
                        var subObject = arr[i];
                        doc[property].push(Persistence.toDocument(subObject));
                    }
                }
                else if (typeof object[property] == 'object') {
                    doc[property] = Persistence.toDocument(object[property]);
                }
                else if (typeof object[property] == 'function') {
                }
                else {
                    console.error("Unsupported type : ", typeof object[property]);
                }
            }
        }
        return doc;
    };
    Persistence.apply = function (o, fktName, args) {
        if (o.isWrapped) {
            if (o[fktName].originalFunction) {
                return o[fktName].originalFunction.apply(o, args);
            }
        }
        else
            return o[fktName].apply(o, args);
    };
    Persistence.persistClass = function (c, collectionName) {
        // only wrap classes once
        var className = PersistenceDescriptor.functionName(c);
        if (!Persistence.classes[className]) {
            if (collection) {
                // also set the collection on the class
                c.collection = collection;
            }
            // iterate over all properties of the prototype. this is where the functions are.
            for (var property in c.prototype) {
                // only bother with functions
                if (typeof c.prototype[property] === "function") {
                    // if it is not a getter or something alike?
                    //if( property.indexOf("get")!=0 && property.indexOf("set")!=0 && property.indexOf("is")!=0 && property.indexOf("can")!=0 && property.indexOf("has")!=0 && property.indexOf("to")!=0 && property.indexOf("constructor")!=0 )
                    if (c.persistenceDescriptor.isMarkedAsPersisted(property)) {
                        // replace the function with a wrapper function that either does a meteor call or call to the original
                        console.log("Meteor wrapping function call: " + property + " on " + className);
                        var f = function meteorCallWrapper() {
                            // If this is object is part of persistence and no wrapped call is in progress ...
                            if (!Persistence.wrappedCallInProgress && this.persistencePath) {
                                // hello meteor
                                console.log("Meteor call " + arguments.callee.functionName + " with arguments " + arguments + " path:", this.persistencePath);
                                Meteor.call("wrappedCall", this.persistencePath, arguments.callee.functionName, arguments);
                            }
                            else {
                                // otherwise execute the regular function
                                return arguments.callee.originalFunction.apply(this, arguments);
                            }
                        };
                        // this stores the old function on the wrapping one
                        f.originalFunction = c.prototype[property];
                        // this keeps the original method name accessible as the closure somehow cant access a loop iterator
                        f.functionName = property;
                        // set the wrapping function on the class
                        c.prototype[property] = f;
                    }
                    else if (property.indexOf("get") == 0) {
                        // create a function that inspects the result and sets the persistence path on the result
                        var f = function () {
                            var result = arguments.callee.originalFunction.apply(this, arguments);
                            if (typeof result == "object") {
                                if (this.persistencePath && !result.persistencePath) {
                                    var pP = this.persistencePath.clone();
                                    pP.appendFunctionCall(arguments.callee.functionName, arguments);
                                    if (Array.isArray(result)) {
                                        for (var i = 0; i < result.length; i++) {
                                            var ppi = pP.clone();
                                            ppi.appendIndex(i);
                                            result[i].persistencePath = ppi;
                                        }
                                    }
                                    else {
                                        result.persistencePath = pP;
                                    }
                                }
                            }
                            return result;
                        };
                        f.originalFunction = c.prototype[property];
                        f.functionName = property;
                        c.prototype[property] = f;
                    }
                }
            }
        }
        Persistence.classes[className] = c;
    };
    Persistence.collections = {};
    Persistence.classes = {};
    Persistence.wrappedCallInProgress = false;
    return Persistence;
})();
// TODO make the persistence Path a class
// TODO take a closer look on how secure this is
// This "monkey-patches" all function calls that do not start with get, set, is, can, has and to. It wraps a meteor call
// around this function call. Once a "wrapped call" is in process all function calls are routed through directly.
// The other thing it does is that all getters are wrapped so that their results also contain a property "persistencePath"
// a persistence path allows to find the object again based on an initially loaded object from meteor so that the wrapped
// function call can then be invoked on the meteor side.
// this registers the meteor function that eventually gets called by the wrapping function
Meteor.methods({
    wrappedCall: function (persistencePath, functionName, args) {
        // TODO is this secure?
        check(persistencePath, Object);
        check(functionName, String);
        check(args, Array);
        //PersistentObject.verifiedUpdate( Persistence.collections[persistencePath.collection], {_id:persistencePath.id}, function( o ){
        //    PersistentObject.wrappedCallInProgress = true;
        //    if( persistencePath.path )
        //    {
        //        for( var i=0;i< persistencePath.path.length;i++ )
        //        {
        //            var pathEntry = persistencePath.path[i];
        //            if(typeof pathEntry.index==="number")
        //                o = o[pathEntry.index];
        //            else if(pathEntry.fkt)
        //            {
        //                o = PersistentObject.apply(o, pathEntry.fkt, pathEntry.arguments);
        //            }
        //        }
        //    }
        //    PersistentObject.apply(o, functionName, args);
        //    PersistentObject.wrappedCallInProgress = false;
        //} );
    }
});
//PersistentObject.afterToDocument = function(classConstructor, modificationFunction) {
//    if( !classConstructor.afterToDocument )
//    {
//        classConstructor.afterToDocument = [];
//    }
//    classConstructor.afterToDocument.push( modificationFunction );
//};
//
//PersistentObject.foreignKey = function( classConstructor, propertyName, toKeyFunction, toObjectFunction )
//{
//    Object.defineProperty(classConstructor,propertyName,{ get:function(){
//        if( !PersistentObject.isSaving && !this[propertyName] && this[propertyName+"Id"] )
//        {
//            var v = toObjectFunction(this[propertyName+"Id"]);
//            this[propertyName] = v;
//            return this[propertyName];
//        }
//        else
//            return undefined;
//    }, set:function( value ){
//        this[propertyName] = value;
//        this[propertyName+"Id"] = toKeyFunction( value );
//    }});
//};
//# sourceMappingURL=000_PersistentObject.js.map