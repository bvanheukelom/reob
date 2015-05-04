require("reflect-metadata");
//import Serializer = require( "./Serializer" );
//import PersistencePath = require( "./PersistencePath" );
var Test;
(function (Test) {
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
    Test.TestAddressBook = TestAddressBook;
})(Test || (Test = {}));
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