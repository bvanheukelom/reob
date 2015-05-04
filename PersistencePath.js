/**
 * Created by bert on 04.05.15.
 */
var PersistencePathEntry = (function () {
    function PersistencePathEntry() {
    }
    PersistencePathEntry.prototype.clone = function () {
        var pe = new PersistencePathEntry();
        pe.fkt = this.fkt;
        pe.arguments = this.arguments;
        pe.index = this.index;
        return pe;
    };
    return PersistencePathEntry;
})();
var PersistencePath = (function () {
    function PersistencePath(collection, id) {
        this.collection = collection;
        this.id = id;
    }
    PersistencePath.prototype.clone = function () {
        var r = new PersistencePath(this.collection, this.id);
        if (this.callPath) {
            r.callPath = [];
            for (var i in this.callPath) {
                var entry = this.callPath[i];
                r.callPath.push(entry.clone());
            }
        }
        return r;
    };
    PersistencePath.apply = function (o, fktName, args) {
        if (o.isWrapped) {
            if (o[fktName].originalFunction) {
                return o[fktName].originalFunction.apply(o, args);
            }
        }
        else
            return o[fktName].apply(o, args);
    };
    PersistencePath.prototype.followCallPath = function (o) {
        if (this.callPath) {
            for (var i = 0; i < this.callPath.length; i++) {
                var pathEntry = this.callPath[i];
                if (typeof pathEntry.index === "number")
                    o = o[pathEntry.index];
                else if (pathEntry.fkt) {
                    o = PersistencePath.apply(o, pathEntry.fkt, pathEntry.arguments);
                }
            }
        }
        return o;
    };
    PersistencePath.prototype.appendIndex = function (i) {
        var pe = new PersistencePathEntry();
        pe.index = i;
        this.addEntry(pe);
    };
    PersistencePath.prototype.appendFunctionCall = function (name, args) {
        var pe = new PersistencePathEntry();
        pe.fkt = name;
        pe.arguments = args;
        this.addEntry(pe);
    };
    PersistencePath.prototype.addEntry = function (pe) {
        if (!this.callPath)
            this.callPath = [];
        this.callPath.push(pe);
    };
    return PersistencePath;
})();
module.exports = PersistencePath;
//# sourceMappingURL=PersistencePath.js.map