import "reflect-metadata";
import PersistanceAnnotations = require( "./PersistenceAnnotations" );
import Serializer = require( "./Serializer" );

export class TestPhoneNumber
{
    number:string;
    person:TestPerson;
    timesCalled:number=0;

    constructor(n:string, p:TestPerson)
    {
        this.number = n;
        this.person = p;
    }

    called():void
    {
        this.timesCalled++;
    }

    getNumber():string
    {
        return this.number;
    }
    getTimesCalled():number
    {
        return this.timesCalled;
    }
}

@PersistanceAnnotations.Collection
export class TestPerson
{
    name:string;
    id:string;

    @PersistanceAnnotations.SubDocument(TestPhoneNumber)
    phoneNumbers:Array<TestPhoneNumber> = [];
    addresses:Array<TestAddress> = [];
    trees:Array<TestTree>;
    @PersistanceAnnotations.SubDocument(TestTree)
    tree:TestTree;
    somethingRandom:string;

    constructor(id:string, name:string)
    {
        this.id = id;
        this.name = name;
    }

    getId():string
    {
        return this.id;
    }

    getAddresses():Array<TestAddress>
    {
        return this.addresses;
    }

    @PersistanceAnnotations.Wrap
    addAddress(a:TestAddress):void
    {
        this.addresses.push(a);
    }

    rename(n:string):void
    {
        this.name = n;
    }

    getTrees():Array<TestTree>
    {
        return this.trees;
    }

    getName():string
    {
        return this.name;
    }

    addPhoneNumber( n:string )
    {
        this.phoneNumbers.push( new TestPhoneNumber(n, this) );
    }

    getAddressById(id:String):TestAddress
    {
        for( var i=0;i<this.addresses.length; i++ )
        {
            var address = this.addresses[i];
            if( address.getId()==id )
                return address;
        }
    }

    callPhoneNumber( number:string )
    {
        this.phoneNumbers.forEach(function(pn:TestPhoneNumber){
            if( pn.getNumber()==number )
                pn.called();
        })
    }
}



export class TestAddress
{
    id:string;
    street:string;

    constructor(id:string, street:string)
    {
        this.id = id;;
        this.street = street;
    }

    getId():string
    {
        return this.id;
    }
    getStreet():string
    {
        return this.street;
    }
}

@PersistanceAnnotations.Collection
export class TestTree
{
    id:string;
    height:number=10;
    constructor( id:string )
    {
        this.id = id;
    }

    grow():void
    {
        this.height++;
    }

    getId():string
    {
        return this.id;
    }
}

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
