/**
 * Created by bert on 13.05.15.
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const omm = require("../../src/omm");
const Tests = require("./Tests");
class TestTreeCollection extends omm.Collection {
    constructor(db) {
        super(db, Tests.TestTree, "TheTreeCollection");
        omm.registerObject("TheTreeCollection", this);
    }
    newTree(initialHeight) {
        var t = new Tests.TestTree(initialHeight);
        return this.insert(t).then((id) => {
            return t;
        });
    }
    errorMethod(initialHeight) {
        return Promise.reject("the error");
    }
    deleteTree(treeId) {
        return this.remove(treeId);
    }
    serverFunction(treeId, t, n) {
        return "Hello " + treeId + "!";
    }
    removeAllTrees() {
        return this.getMeteorCollection().remove({});
    }
}
__decorate([
    omm.MeteorMethod({ replaceWithCall: true, serverOnly: true, parameterTypes: ["number", "callback"] })
], TestTreeCollection.prototype, "newTree", null);
__decorate([
    omm.MeteorMethod({ replaceWithCall: true, serverOnly: true, parameterTypes: ["number", "callback"] })
], TestTreeCollection.prototype, "errorMethod", null);
__decorate([
    omm.MeteorMethod({ replaceWithCall: true, parameterTypes: ["string", "callback"] })
], TestTreeCollection.prototype, "deleteTree", null);
__decorate([
    omm.MeteorMethod({ parameterTypes: ["string", "TestTree", "number"] })
], TestTreeCollection.prototype, "serverFunction", null);
__decorate([
    omm.MeteorMethod({ object: 'TestTreeCollection', replaceWithCall: true, parameterTypes: ["callback"] })
], TestTreeCollection.prototype, "removeAllTrees", null);
exports.TestTreeCollection = TestTreeCollection;
//# sourceMappingURL=TestTreeCollection.js.map