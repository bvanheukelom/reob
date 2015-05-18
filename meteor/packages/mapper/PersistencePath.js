///<reference path="./references.d.ts"/>
var mapper;
(function (mapper) {
    var PersistencePath = (function () {
        function PersistencePath(className, id) {
            this.path = className;
            if (id)
                this.path += "[" + id + "]";
            if (!this.getId())
                throw new Error("id is undefined");
        }
        PersistencePath.prototype.clone = function () {
            return new PersistencePath(this.path);
        };
        PersistencePath.prototype.getCollectionName = function () {
            return this.path.split("[")[0];
        };
        PersistencePath.prototype.getId = function () {
            return this.path.split("[")[1].split("]")[0];
        };
        PersistencePath.prototype.getSubObject = function (rootObject) {
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
                                if (arrayEntry.getId() == id) {
                                    o = arrayEntry;
                                    foundEntry = true;
                                    break;
                                }
                            }
                            if (!foundEntry)
                                o = undefined;
                        }
                        else
                            o = o[entry];
                    }
                });
            }
            return o;
        };
        PersistencePath.prototype.appendArrayOrMapLookup = function (name, id) {
            this.path += "." + name + "|" + id;
        };
        PersistencePath.prototype.appendPropertyLookup = function (name) {
            this.path += "." + name;
        };
        PersistencePath.prototype.toString = function () {
            return this.path;
        };
        return PersistencePath;
    })();
    mapper.PersistencePath = PersistencePath;
})(mapper || (mapper = {}));
//# sourceMappingURL=PersistencePath.js.map