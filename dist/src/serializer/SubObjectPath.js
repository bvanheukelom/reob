"use strict";
const omm_annotations = require("../annotations/PersistenceAnnotation");
class SubObjectPath {
    constructor(s) {
        this.path = s || "";
    }
    clone() {
        return new SubObjectPath(this.path);
    }
    forEachPathEntry(iterator) {
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
    }
    getSubObject(rootObject) {
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
    }
    appendArrayOrMapLookup(name, id) {
        if (this.path.length > 0)
            this.path += ".";
        this.path += name + "|" + id;
    }
    appendPropertyLookup(name) {
        if (this.path.length > 0)
            this.path += ".";
        this.path += name;
    }
    toString() {
        return this.path;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SubObjectPath;
//# sourceMappingURL=SubObjectPath.js.map