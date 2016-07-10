"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Created by bert on 10.07.16.
 */
var Tests = require("./Tests");
var omm = require("../../src/omm");
var TreeService = (function () {
    function TreeService(ttc) {
        this.treeCollection = ttc;
    }
    TreeService.prototype.insertTree = function (height) {
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t).then(function (id) {
            return t;
        });
    };
    __decorate([
        omm.MeteorMethod({ serverOnly: true, resultType: "TestTree" })
    ], TreeService.prototype, "insertTree", null);
    return TreeService;
}());
exports.TreeService = TreeService;
//# sourceMappingURL=TreeService.js.map