"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm = require("../../src/omm");
var Tests = require("./Tests");
var TestTree = (function () {
    function TestTree(initialHeight) {
        this.height = 10;
        this.leaves = [];
        this.height = initialHeight || 10;
    }
    TestTree.prototype.grow = function () {
        this.height++;
        //console.log("Tree is growing to new heights: ", this.height+" on the "+(omm.getMeteor().isServer?"server":"client"));
        this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
        this.leaves.forEach(function (l) {
            l.grow();
        });
        // if( omm.getMeteor().isClient )
        return "grown on the client";
        // else
        //     return "grown on the server";
    };
    TestTree.prototype.wither = function () {
        this.leaves = [];
        omm.emit("gardenevents", "withered");
        omm.emit("gardenevents", "withered2");
    };
    TestTree.prototype.thisThrowsAnError = function () {
        throw new Error("Hello world");
    };
    TestTree.prototype.getHeight = function () {
        return this.height;
    };
    TestTree.prototype.getLeaves = function () {
        return this.leaves;
    };
    TestTree.prototype.growAndReturnLeaves = function () {
        this.grow();
        return this.leaves;
    };
    __decorate([
        omm.Id
    ], TestTree.prototype, "treeId", void 0);
    __decorate([
        omm.ArrayType("TestLeaf"),
        omm.DocumentName('thoseGreenThings')
    ], TestTree.prototype, "leaves", void 0);
    __decorate([
        omm.Type("TestAddress")
    ], TestTree.prototype, "address", void 0);
    __decorate([
        omm.Wrap
    ], TestTree.prototype, "grow", null);
    __decorate([
        omm.Wrap
    ], TestTree.prototype, "wither", null);
    __decorate([
        omm.Wrap
    ], TestTree.prototype, "thisThrowsAnError", null);
    __decorate([
        omm.CollectionUpdate,
        omm.MeteorMethod({ replaceWithCall: true, resultType: "TestLeaf" })
    ], TestTree.prototype, "growAndReturnLeaves", null);
    TestTree = __decorate([
        omm.Entity
    ], TestTree);
    return TestTree;
}());
exports.TestTree = TestTree;
//# sourceMappingURL=TestTree.js.map