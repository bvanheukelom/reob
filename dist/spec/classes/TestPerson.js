"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const omm = require("../../src/omm");
let TestPerson = class TestPerson {
    constructor(id, name) {
        this.addresses = [];
        this.trees = [];
        this.phoneBook = {};
        this.
        // @omm.AsForeignKeys
        wood = {};
        this.
        // @omm.AsForeignKeys
        family = {};
        this.gardenState = 10;
        this._id = id;
        this.name = name;
    }
    getId() {
        return this._id;
    }
    setId(id) {
        this._id = id;
    }
    //rename(n:string):void
    //{
    //    this.name = n;
    //}
    getName() {
        return this.name;
    }
    getAddresses() {
        return this.addresses;
    }
    getTree() {
        return this.tree;
    }
    collectLeaf() {
        //console.log("collecting leaf:",this.tree);
        this.leaf = this.tree.getLeaves()[0];
    }
    chooseTree(t) {
        //console.log("choosing tree:",t);
        this.tree = t;
    }
    chooseLeaf(l) {
        this.leaf = l;
    }
    rename(n) {
        this.name = n;
        return this.name;
    }
    collectionUpdateRename(n) {
        this.name = "Collection Update:" + n;
        return this.name;
    }
    addAddress(a) {
        //console.log("inside add address:", (a instanceof Tests.TestAddress));
        this.addresses.push(a);
        return a;
    }
    addAddresses(addresses) {
        var that = this;
        addresses.forEach(function (a) {
            //console.log('street:',a.getStreet());
            that.addresses.push(a);
        });
        return this.addresses;
    }
    // @omm.MeteorMethod({parameterTypes:["callback"], replaceWithCall:true, serverOnly:true})
    // fromServer(cb:(error:any, r:any)=>void):void
    // {
    //     if(omm.getMeteor().isClient)
    //         throw new Error("though shall not be called on the client");
    //     cb(undefined, omm.getMeteor().isServer);
    // }
    addToWood(t, s) {
        this.trees.push(t);
        if (s)
            this.wood[s] = t;
    }
    addFamilyRelation(s, p) {
        if (s)
            this.family[s] = p;
    }
    addPhoneNumber(s, p) {
        this.phoneBook[s] = p;
    }
    tendToGarden() {
        this.gardenState++;
        this.tree.grow();
        return this.tree.getHeight();
    }
};
__decorate([
    omm.Type("TestPhoneNumber")
], TestPerson.prototype, "phoneNumber", void 0);
__decorate([
    omm.ArrayOrMap("TestAddress")
], TestPerson.prototype, "addresses", void 0);
__decorate([
    omm.Type("TestTree")
], TestPerson.prototype, "tree", void 0);
__decorate([
    omm.Type("TestLeaf")
], TestPerson.prototype, "leaf", void 0);
__decorate([
    omm.ArrayOrMap("TestLeaf")
], TestPerson.prototype, "trees", void 0);
__decorate([
    omm.ArrayOrMap("TestPhoneNumber")
], TestPerson.prototype, "phoneBook", void 0);
__decorate([
    omm.ArrayOrMap("TestTree")
], TestPerson.prototype, "wood", void 0);
__decorate([
    omm.ArrayOrMap("TestPerson")
], TestPerson.prototype, "family", void 0);
__decorate([
    omm.Wrap
], TestPerson.prototype, "collectLeaf", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "chooseTree", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "chooseLeaf", null);
__decorate([
    omm.CollectionUpdate,
    omm.MeteorMethod
], TestPerson.prototype, "rename", null);
__decorate([
    omm.CollectionUpdate,
    omm.MeteorMethod
], TestPerson.prototype, "collectionUpdateRename", null);
__decorate([
    omm.CollectionUpdate,
    omm.MeteorMethod({ parameterTypes: ["TestAddress"], replaceWithCall: true })
], TestPerson.prototype, "addAddress", null);
__decorate([
    omm.CollectionUpdate,
    omm.MeteorMethod({ parameterTypes: ["TestAddress"], replaceWithCall: true })
], TestPerson.prototype, "addAddresses", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "addToWood", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "addFamilyRelation", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "addPhoneNumber", null);
__decorate([
    omm.Wrap
], TestPerson.prototype, "tendToGarden", null);
TestPerson = __decorate([
    omm.Entity
], TestPerson);
exports.TestPerson = TestPerson;
//# sourceMappingURL=TestPerson.js.map