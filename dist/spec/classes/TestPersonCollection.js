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
var TestPersonCollection = (function (_super) {
    __extends(TestPersonCollection, _super);
    function TestPersonCollection() {
        _super.call(this, Tests.TestPerson);
        omm.registerObject("TestPersonCollection", this);
    }
    TestPersonCollection.prototype.newPerson = function (n) {
        var _this = this;
        var p = new Tests.TestPerson();
        p.name = n;
        return this.insert(p).then(function (id) {
            return _this.getById(id);
        });
    };
    // @omm.MeteorMethod({object:'TestPersonCollection'})
    // insertPerson(n:string):Tests.TestPerson {
    //     var p:Tests.TestPerson = new Tests.TestPerson();
    //     p.name = n;
    //     var that = this;
    //     var id = this.insert(p);
    //     return this.getById(id);
    // }
    TestPersonCollection.prototype.haveBaby = function (mom, dad) {
        var _this = this;
        //console.log("mom: ", mom);
        //console.log("dad: ", dad);
        var kid = new Tests.TestPerson();
        kid.name = "child of " + mom.name + " and " + dad.name;
        kid.family["mom"] = mom;
        kid.family["dad"] = dad;
        return this.insert(kid).then(function (id) {
            return _this.getById(id);
        });
    };
    TestPersonCollection.prototype.removePerson = function (id) {
        return this.remove(id);
    };
    TestPersonCollection.prototype.removeAllPersons = function () {
        return this.getMeteorCollection().remove({});
    };
    __decorate([
        omm.MeteorMethod({ serverOnly: true, parameterTypes: ["string", "callback"] })
    ], TestPersonCollection.prototype, "newPerson", null);
    __decorate([
        omm.MeteorMethod({ parameterTypes: ["TestPerson", "TestPerson", "callback"] })
    ], TestPersonCollection.prototype, "haveBaby", null);
    __decorate([
        omm.MeteorMethod({ serverOnly: true, parameterTypes: ["string", "callback"] })
    ], TestPersonCollection.prototype, "removePerson", null);
    __decorate([
        omm.MeteorMethod({ serverOnly: true, parameterTypes: ["callback"] })
    ], TestPersonCollection.prototype, "removeAllPersons", null);
    return TestPersonCollection;
}(omm.Collection));
exports.TestPersonCollection = TestPersonCollection;
// omm.registerObject('TestPersonCollection', new TestPersonCollection());
//# sourceMappingURL=TestPersonCollection.js.map