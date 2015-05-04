if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
if (typeof __metadata !== "function") __metadata = function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
require("reflect-metadata");
var PersistanceAnnotations = require("./PersistenceAnnotations");
var TestPhoneNumber = (function () {
    function TestPhoneNumber(n, p) {
        this.timesCalled = 0;
        this.number = n;
        this.person = p;
    }
    TestPhoneNumber.prototype.called = function () {
        this.timesCalled++;
    };
    TestPhoneNumber.prototype.getNumber = function () {
        return this.number;
    };
    TestPhoneNumber.prototype.getTimesCalled = function () {
        return this.timesCalled;
    };
    return TestPhoneNumber;
})();
exports.TestPhoneNumber = TestPhoneNumber;
var TestPerson = (function () {
    function TestPerson(id, name) {
        this.phoneNumbers = [];
        this.addresses = [];
        this.id = id;
        this.name = name;
    }
    TestPerson.prototype.getId = function () {
        return this.id;
    };
    TestPerson.prototype.getAddresses = function () {
        return this.addresses;
    };
    TestPerson.prototype.addAddress = function (a) {
        this.addresses.push(a);
    };
    TestPerson.prototype.rename = function (n) {
        this.name = n;
    };
    TestPerson.prototype.getTrees = function () {
        return this.trees;
    };
    TestPerson.prototype.getName = function () {
        return this.name;
    };
    TestPerson.prototype.addPhoneNumber = function (n) {
        this.phoneNumbers.push(new TestPhoneNumber(n, this));
    };
    TestPerson.prototype.getAddressById = function (id) {
        for (var i = 0; i < this.addresses.length; i++) {
            var address = this.addresses[i];
            if (address.getId() == id)
                return address;
        }
    };
    TestPerson.prototype.callPhoneNumber = function (number) {
        this.phoneNumbers.forEach(function (pn) {
            if (pn.getNumber() == number)
                pn.called();
        });
    };
    __decorate([
        PersistanceAnnotations.SubDocument(TestPhoneNumber), 
        __metadata('design:type', Array)
    ], TestPerson.prototype, "phoneNumbers");
    __decorate([
        PersistanceAnnotations.SubDocument(TestTree), 
        __metadata('design:type', TestTree)
    ], TestPerson.prototype, "tree");
    Object.defineProperty(TestPerson.prototype, "addAddress",
        __decorate([
            PersistanceAnnotations.Wrap, 
            __metadata('design:type', Function), 
            __metadata('design:paramtypes', [TestAddress]), 
            __metadata('design:returntype', void 0)
        ], TestPerson.prototype, "addAddress", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addAddress")));
    TestPerson = __decorate([
        PersistanceAnnotations.Collection, 
        __metadata('design:paramtypes', [String, String])
    ], TestPerson);
    return TestPerson;
})();
exports.TestPerson = TestPerson;
var TestAddress = (function () {
    function TestAddress(id, street) {
        this.id = id;
        ;
        this.street = street;
    }
    TestAddress.prototype.getId = function () {
        return this.id;
    };
    TestAddress.prototype.getStreet = function () {
        return this.street;
    };
    return TestAddress;
})();
exports.TestAddress = TestAddress;
var TestTree = (function () {
    function TestTree(id) {
        this.height = 10;
        this.id = id;
    }
    TestTree.prototype.grow = function () {
        this.height++;
    };
    TestTree.prototype.getId = function () {
        return this.id;
    };
    TestTree = __decorate([
        PersistanceAnnotations.Collection, 
        __metadata('design:paramtypes', [String])
    ], TestTree);
    return TestTree;
})();
exports.TestTree = TestTree;
var TestAddressBook = (function () {
    function TestAddressBook(id) {
        this.phoneNumbers = [];
        this.id = id;
    }
    TestAddressBook.prototype.addPhoneNumber = function (pn) {
        this.phoneNumbers.push(pn);
    };
    return TestAddressBook;
})();
exports.TestAddressBook = TestAddressBook;
//PersistenceDescriptor.persistAfterInvocation( TestPerson.prototype.rename );
//PersistenceDescriptor.persistAfterInvocation( TestPerson.prototype.addPhoneNumber );
//PersistenceDescriptor.subDocumentClass( TestPerson, "phoneNumbers", TestPhoneNumber );
//PersistenceDescriptor.subDocumentClass( TestPerson, "trees", TestTree );
//PersistenceDescriptor.subDocumentClass( TestPerson, "addresses", TestAddress );
//
//PersistenceDescriptor.persistAfterInvocation( TestPhoneNumber.prototype.called );
//PersistenceDescriptor.persistAfterInvocation( TestTree.prototype.grow );
//PersistenceDescriptor.persistAfterInvocation( TestAddressBook.prototype.addPhoneNumber );
//
//PersistenceDescriptor.persistAsIds( TestPerson, "trees", TestTree );
//PersistenceDescriptor.persistAsIds( TestAddressBook, "phoneNumbers", TestPhoneNumber, function( person:TestPerson, id:string ){
//    return person.getAddressById(id);
//} );
//# sourceMappingURL=TestClass.js.map