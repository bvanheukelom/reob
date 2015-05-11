///<reference path="references.d.ts"/>
persistence;
(function (persistence) {
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
        PersistencePath.prototype.getClassName = function () {
            return this.path.split("[")[0];
        };
        PersistencePath.prototype.getId = function () {
            return this.path.split("[")[1].split("]")[0];
        };
        PersistencePath.prototype.getSubObject = function (rootObject) {
            var o = rootObject;
            if (this.path.indexOf(".") != -1) {
                this.path.split("].")[1].split(".").forEach(function (entry) {
                    var foundEntry = false;
                    if (o instanceof Array) {
                        for (var j in o) {
                            var arrayEntry = o[j];
                            if (arrayEntry.getId() == entry) {
                                o = arrayEntry;
                                foundEntry = true;
                                break;
                            }
                        }
                        if (!foundEntry)
                            return undefined;
                    }
                    else if (o)
                        o = o[entry];
                });
            }
            return o;
        };
        PersistencePath.prototype.appendArrayLookup = function (id) {
            this.path += "." + id;
        };
        PersistencePath.prototype.appendPropertyLookup = function (name) {
            this.path += "." + name;
        };
        PersistencePath.prototype.toString = function () {
            return this.path;
        };
        return PersistencePath;
    })();
    persistence.PersistencePath = PersistencePath;
})(persistence || (persistence = {}));
