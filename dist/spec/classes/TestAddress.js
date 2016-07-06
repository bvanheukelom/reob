"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Created by bert on 04.05.15.
 */
const omm = require("../../src/omm");
let TestAddress = class TestAddress {
    constructor(street, person) {
        this.street = street;
        this.person = person;
    }
    getStreet() {
        return this.street;
    }
};
__decorate([
    omm.Parent
], TestAddress.prototype, "person", void 0);
TestAddress = __decorate([
    omm.Entity
], TestAddress);
exports.TestAddress = TestAddress;
//# sourceMappingURL=TestAddress.js.map