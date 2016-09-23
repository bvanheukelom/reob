"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm = require("../../src/omm");
var TestInheritanceParent = (function () {
    function TestInheritanceParent() {
    }
    return TestInheritanceParent;
}());
__decorate([
    omm.Type("TestInheritanceOther")
], TestInheritanceParent.prototype, "parentOther", void 0);
__decorate([
    omm.Type("TestPerson")
], TestInheritanceParent.prototype, "person", void 0);
__decorate([
    omm.Ignore
], TestInheritanceParent.prototype, "ignoredOther", void 0);
TestInheritanceParent = __decorate([
    omm.Entity
], TestInheritanceParent);
exports.TestInheritanceParent = TestInheritanceParent;
//# sourceMappingURL=TestInheritanceParent.js.map