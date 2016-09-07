"use strict";
var omm_annotations = require("../annotations/PersistenceAnnotation");
var SubObjectPath = (function () {
    function SubObjectPath(s) {
        this.path = s || "";
    }
    SubObjectPath.prototype.clone = function () {
        return new SubObjectPath(this.path);
    };
    SubObjectPath.prototype.forEachPathEntry = function (iterator) {
        if (this.path.length > 0)
            this.path.split(".").forEach(function (entry) {
                var propertyName = entry;
                var id = undefined;
                if (entry.indexOf("|") != -1) {
                    propertyName = entry.split("|")[0];
                    id = entry.split("|")[1];
                }
                iterator(propertyName, id);
            });
    };
    SubObjectPath.prototype.getSubObject = function (rootObject) {
        var o = rootObject;
        this.forEachPathEntry(function (propertyName, id) {
            if (typeof o != "undefined") {
                o = o[propertyName];
                if (typeof o != "undefined" && typeof id != "undefined") {
                    var foundEntry = false;
                    for (var j in o) {
                        var arrayEntry = o[j];
                        if (omm_annotations.getId(arrayEntry) === id) {
                            o = arrayEntry;
                            foundEntry = true;
                            break;
                        }
                    }
                    if (!foundEntry) {
                        o = o[id];
                    }
                }
            }
        });
        return o;
    };
    SubObjectPath.prototype.appendArrayOrMapLookup = function (name, id) {
        if (this.path.length > 0)
            this.path += ".";
        this.path += name + "|" + id;
    };
    SubObjectPath.prototype.appendPropertyLookup = function (name) {
        if (this.path.length > 0)
            this.path += ".";
        this.path += name;
    };
    SubObjectPath.prototype.toString = function () {
        return this.path;
    };
    return SubObjectPath;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SubObjectPath;
//# sourceMappingURL=SubObjectPath.js.map