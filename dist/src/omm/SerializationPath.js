"use strict";
var PersistenceAnnotation = require("../annotations/PersistenceAnnotation");
var SerializationPath = (function () {
    // this is used when lazy loading properties
    // private objectRetriever:ObjectRetriever;
    function SerializationPath(collectionName, id) {
        this.path = collectionName;
        // this.objectRetriever = objectRetriever;
        if (id)
            this.path += "[" + id + "]";
        if (!this.getId())
            throw new Error("id is undefined");
    }
    SerializationPath.prototype.clone = function () {
        var sp = new SerializationPath(this.path);
        return sp;
    };
    SerializationPath.prototype.getCollectionName = function () {
        return this.path.split("[")[0];
    };
    SerializationPath.prototype.getId = function () {
        return this.path.split("[")[1].split("]")[0];
    };
    SerializationPath.prototype.forEachPathEntry = function (iterator) {
        if (this.path.indexOf(".") != -1)
            this.path.split("].")[1].split(".").forEach(function (entry) {
                var propertyName = entry;
                var index = undefined;
                if (entry.indexOf("|") != -1) {
                    propertyName = entry.split("|")[0];
                    index = entry.split("|")[1];
                }
                iterator(propertyName, index);
            });
    };
    SerializationPath.prototype.getSubObject = function (rootObject) {
        var o = rootObject;
        if (this.path.indexOf(".") != -1) {
            this.path.split("].")[1].split(".").forEach(function (entry) {
                if (o) {
                    if (entry.indexOf("|") != -1) {
                        var p = entry.split("|");
                        var arrayOrMap = o[p[0]];
                        var id = p[1];
                        var foundEntry = false;
                        for (var j in arrayOrMap) {
                            var arrayEntry = arrayOrMap[j];
                            if (arrayEntry.getId && arrayEntry.getId() == id) {
                                o = arrayEntry;
                                foundEntry = true;
                                break;
                            }
                        }
                        if (!foundEntry) {
                            if (arrayOrMap[id])
                                o = arrayOrMap[id];
                            else
                                o = undefined;
                        }
                    }
                    else
                        o = o[entry];
                }
            });
        }
        return o;
    };
    SerializationPath.prototype.appendArrayOrMapLookup = function (name, id) {
        this.path += "." + name + "|" + id;
    };
    SerializationPath.prototype.appendPropertyLookup = function (name) {
        this.path += "." + name;
    };
    SerializationPath.prototype.toString = function () {
        return this.path;
    };
    SerializationPath.setObjectContext = function (object, sp, handler) {
        if (object)
            PersistenceAnnotation.setNonEnumerableProperty(object, "_ommObjectContext", { serializationPath: sp, handler: handler });
    };
    SerializationPath.getObjectContext = function (object) {
        return object ? object._ommObjectContext : undefined;
    };
    // if I could I would make this package protected
    SerializationPath.updateObjectContexts = function (object, handler, visited) {
        var that = this;
        if (!visited)
            visited = [];
        if (visited.indexOf(object) != -1)
            return;
        if (!object || typeof object != "object")
            return;
        visited.push(object);
        var objectClass = PersistenceAnnotation.PersistenceAnnotation.getClass(object);
        if (PersistenceAnnotation.PersistenceAnnotation.isRootEntity(objectClass)) {
            if (!object._ommObjectContext || !object._ommObjectContext.serializationPath) {
                var idPropertyName = PersistenceAnnotation.PersistenceAnnotation.getIdPropertyName(objectClass);
                var id = object[idPropertyName];
                if (id) {
                    var sp = new SerializationPath(PersistenceAnnotation.PersistenceAnnotation.getCollectionName(objectClass), id);
                    SerializationPath.setObjectContext(object, sp, handler);
                }
            }
        }
        if (!object._ommObjectContext)
            return; // we're done here
        PersistenceAnnotation.PersistenceAnnotation.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName) {
            // if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
            //     //console.log("updating foreignkey property " + typedPropertyName);
            var v = object[typedPropertyName];
            if (v) {
                if (PersistenceAnnotation.PersistenceAnnotation.isArrayOrMap(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName + " is array");
                    for (var i in v) {
                        var e = v[i];
                        if (e) {
                            var index = i;
                            if (PersistenceAnnotation.getId(e))
                                index = PersistenceAnnotation.getId(e);
                            //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                            var sp = object._ommObjectContext.serializationPath.clone();
                            sp.appendArrayOrMapLookup(typedPropertyName, index);
                            SerializationPath.setObjectContext(e, sp, handler);
                            that.updateObjectContexts(e, handler, visited);
                        }
                    }
                }
                else {
                    //console.log("updating foreignkey property direct property " + typedPropertyName);
                    var sp = object._ommObjectContext.serializationPath.clone();
                    sp.appendPropertyLookup(typedPropertyName);
                    SerializationPath.setObjectContext(v, sp, handler);
                }
            }
        });
    };
    return SerializationPath;
}());
exports.SerializationPath = SerializationPath;
//# sourceMappingURL=SerializationPath.js.map