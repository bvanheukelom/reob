/**
 * Created by bert on 07.05.15.
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm = require("../../src/omm");
var TestLeaf = (function () {
    function TestLeaf(id, parent) {
        this._id = id;
        this.greenNess = 1;
        this.parent = parent;
    }
    TestLeaf.prototype.getId = function () {
        return this._id;
    };
    TestLeaf.prototype.grow = function () {
        this.greenNess++;
    };
    TestLeaf.prototype.getTree = function () {
        return this.parent;
    };
    TestLeaf.prototype.flutter = function () {
        this.greenNess++;
        omm.emit("fluttering");
    };
    return TestLeaf;
}());
__decorate([
    omm.DocumentName("greenIndex")
], TestLeaf.prototype, "greenNess", void 0);
__decorate([
    omm.Parent
], TestLeaf.prototype, "parent", void 0);
__decorate([
    omm.Wrap
], TestLeaf.prototype, "flutter", null);
TestLeaf = __decorate([
    omm.Entity
], TestLeaf);
exports.TestLeaf = TestLeaf;
//# sourceMappingURL=TestLeaf.js.map