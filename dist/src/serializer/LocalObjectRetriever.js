"use strict";
const SubObjectPath_1 = require("./SubObjectPath");
const Serializer_1 = require("./Serializer");
class LocalObjectRetriever {
    constructor() {
    }
    setQuietProperty(obj, propertyName, value) {
        if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
            Object.defineProperty(obj, propertyName, {
                configurable: false,
                enumerable: false,
                writable: true
            });
        }
        obj[propertyName] = value;
    }
    getId(o) {
        var p = o["localPath"];
        return p;
    }
    getObject(s, parentObject, propertyName) {
        var subObjectPath = new SubObjectPath_1.default(s);
        return Promise.resolve(subObjectPath.getSubObject(parentObject["rootObject"]));
    }
    preToDocument(o) {
        var that = this;
        // Serializer.forEachTypedObject(o, function(path:SubObjectPath, subO:Object){
        //     that.setQuietProperty(subO,"localPath",path.toString());
        // });
    }
    postToObject(o) {
        var that = this;
        Serializer_1.default.forEachTypedObject(o, function (path, subO) {
            that.setQuietProperty(subO, "rootObject", o);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LocalObjectRetriever;
//# sourceMappingURL=LocalObjectRetriever.js.map