/**
 * Created by bert on 02.05.16.
 */
"use strict";
function clone(o) {
    return cloneInternally(o, {
        objects: [],
        clones: []
    });
}
exports.clone = clone;
function cloneInternally(o, seenObjects) {
    if (Array.isArray(o)) {
        var rArray = [];
        var arr = o;
        for (var j = 0; j < arr.length; j++) {
            rArray[j] = cloneInternally(o[j], seenObjects);
        }
        return rArray;
    }
    else if (!o || typeof o == "string" || typeof o == "number" || o instanceof Date || typeof o == "boolean" || typeof o == "function")
        return o;
    else {
        var seenIndex = seenObjects.objects.indexOf(o);
        if (seenIndex != -1) {
            return seenObjects.clones[seenIndex];
        }
        else {
            var rObj = o.constructor ? Object.create(o.constructor.prototype) : {};
            seenObjects.objects.push(o);
            seenObjects.clones.push(rObj);
            for (var property in o) {
                if (o.hasOwnProperty(property))
                    rObj[property] = cloneInternally(o[property], seenObjects);
            }
            return rObj;
        }
    }
}
//# sourceMappingURL=Cloner.js.map