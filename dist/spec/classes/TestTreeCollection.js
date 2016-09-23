/**
 * Created by bert on 13.05.15.
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm = require("../../src/omm");
var Tests = require("./Tests");
var TestTreeCollection = (function (_super) {
    __extends(TestTreeCollection, _super);
    function TestTreeCollection(db) {
        _super.call(this, db, Tests.TestTree, "TheTreeCollection");
    }
    TestTreeCollection.prototype.newTree = function (initialHeight) {
        var t = new Tests.TestTree(initialHeight);
        return this.insert(t).then(function (id) {
            return t;
        });
    };
    TestTreeCollection.prototype.errorMethod = function (initialHeight) {
        return Promise.reject("the error");
    };
    TestTreeCollection.prototype.deleteTree = function (treeId) {
        return this.remove(treeId);
    };
    TestTreeCollection.prototype.serverFunction = function (treeId, t, n) {
        return "Hello " + treeId + "!";
    };
    TestTreeCollection.prototype.removeAllTrees = function () {
        return this.getMongoCollection().remove({});
    };
    return TestTreeCollection;
}(omm.Collection));
exports.TestTreeCollection = TestTreeCollection;
__decorate([
    omm.MeteorMethod({ serverOnly: true })
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
//# sourceMappingURL=TestTreeCollection.js.map