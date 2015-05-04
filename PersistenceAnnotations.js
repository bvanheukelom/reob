/**
 * Created by bert on 03.05.15.
 */
///<reference path="node_modules\reflect-metadata\reflect-metadata.d.ts"/>
require("reflect-metadata");
function getCollectionName(f) {
    return Reflect.getMetadata("persistence:collection", f);
}
exports.getCollectionName = getCollectionName;
function getPropertyClass(f, propertyName) {
    return Reflect.getMetadata("persistence:subdocument", f, propertyName);
}
exports.getPropertyClass = getPropertyClass;
function getSubDocumentPropertyNames(f) {
    console.log("all keys:", Reflect.getMetadataKeys(f));
    return [];
    //return Reflect.getMetadata("persistence:subdocument",  f, propertyName );
}
exports.getSubDocumentPropertyNames = getSubDocumentPropertyNames;
function getCollectionClasses() {
    return PersistencePrivate.collectionRootClasses;
}
exports.getCollectionClasses = getCollectionClasses;
var PersistencePrivate = (function () {
    function PersistencePrivate() {
    }
    // TODO this is duplicate code, needs resolving. Didn't want this to depend on code that currently lives on the meteor side.
    PersistencePrivate.functionName = function (fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    PersistencePrivate.collectionRootClasses = [];
    return PersistencePrivate;
})();
function SubDocument(subdocumentConstructor) {
    return function (target, propertyName) {
        //console.log("Classname "+subdocumentConstructor, target, propertyName);
        Reflect.defineMetadata("persistence:subdocument", subdocumentConstructor, target, propertyName);
    };
}
exports.SubDocument = SubDocument;
function Collection(p1) {
    if (typeof p1 == "string") {
        return function (target) {
            console.log("collection name ", p1);
            Reflect.defineMetadata("persistence:collection", PersistencePrivate.functionName(p1), p1);
            PersistencePrivate.collectionRootClasses.push(p1);
        };
    }
    else {
        console.log("collection solo ", PersistencePrivate.functionName(p1));
        PersistencePrivate.collectionRootClasses.push(p1);
        Reflect.defineMetadata("persistence:collection", PersistencePrivate.functionName(p1), p1);
    }
}
exports.Collection = Collection;
function Wrap(t, functionName, objectDescriptor) {
    console.log("wrapping " + functionName + " on " + t);
    //return function (target:Function, p2:any, p3:any) {
    //    console.log("wrapping 2",t,target,p2,p3);
    //    //Reflect.defineMetadata("persistence:wrap", true, (<any>t)[functionName]);
    //};
}
exports.Wrap = Wrap;
//# sourceMappingURL=PersistenceAnnotations.js.map