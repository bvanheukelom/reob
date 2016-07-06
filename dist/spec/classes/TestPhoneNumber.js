"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const omm = require("../../src/omm");
let TestPhoneNumber_1 = class TestPhoneNumber {
    constructor(n) {
        this.number = n;
        this.timesCalled = 0;
    }
    getNumber() {
        return this.number;
    }
    static toDocument(t) {
        return {
            freak: "show",
            pn: t.number
        };
    }
    static toObject(d) {
        var dn = d;
        if (!dn || !dn.freak)
            throw new Error("not freaky enough");
        return new TestPhoneNumber_1(dn.pn);
    }
    callNumber() {
        this.timesCalled++;
        //console.log("Calling a phone number : ",this.number);
        return "Calling a phone number : " + this.number;
    }
    callNumberFrantically(degreeOfUrgency, callback) {
        var that = this;
        console.log("Calling a phone number : ", callback);
        setTimeout(function () {
            callback(undefined, "Called:" + that.number + " " + degreeOfUrgency + " time(s)");
        }, 300);
    }
};
let TestPhoneNumber = TestPhoneNumber_1;
__decorate([
    omm.Wrap
], TestPhoneNumber.prototype, "callNumber", null);
TestPhoneNumber = TestPhoneNumber_1 = __decorate([
    omm.Entity
], TestPhoneNumber);
exports.TestPhoneNumber = TestPhoneNumber;
//# sourceMappingURL=TestPhoneNumber.js.map