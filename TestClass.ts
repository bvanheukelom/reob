import "reflect-metadata";
import PersistenceAnnotation = require( "./PersistenceAnnotation" );
//import Serializer = require( "./Serializer" );
//import PersistencePath = require( "./PersistencePath" );

module Test
{




export class TestAddressBook
{
    id:string;
    phoneNumbers:Array<TestPhoneNumber> = [];
    constructor(id:string)
    {
        this.id = id;
    }

    addPhoneNumber( pn:TestPhoneNumber )
    {
        this.phoneNumbers.push(pn);
    }
}

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
