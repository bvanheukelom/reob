/**
 * Created by bert on 04.05.15.
 */
import PersistenceAnnotation = require( "./PersistenceAnnotation" );
import TestPhoneNumber = require("./TestPhoneNumber");
import TestTree = require("./TestTree");
import TestLeaf = require("./TestLeaf");
import TestAddress = require("./TestAddress");

@PersistenceAnnotation.Entity
class TestPerson
{
    name:string;
    _id:string;

    @PersistenceAnnotation.Type("TestPhoneNumber")
    private phoneNumbers:Array<TestPhoneNumber> = [];
    @PersistenceAnnotation.Type("TestAddress")
    private addresses:Array<TestAddress> = [];
    private trees:Array<TestTree>;

    @PersistenceAnnotation.Type("TestTree")
    @PersistenceAnnotation.AsForeignKeys
    tree:TestTree;
    leaf:TestLeaf;


    constructor(id?:string, name?:string)
    {
        this._id = id;
        this.name = name;
        console.log("");
    }

    getId():string
    {
        return this._id;
    }

    @PersistenceAnnotation.Wrap
    addAddress(a:TestAddress):void
    {
        console.log("inside add address:", (a instanceof TestAddress));
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

    //getAddressById(id:String):TestAddress
    //{
    //    for( var i=0;i<this.addresses.length; i++ )
    //    {
    //        var address = this.addresses[i];
    //        if( address.getId()==id )
    //            return address;
    //    }
    //}

    getAddresses():Array<TestAddress>
    {
        return this.addresses;
    }

    getTree():TestTree
    {
        return this.tree;
    }

    callPhoneNumber( number:string )
    {
        this.phoneNumbers.forEach(function(pn:TestPhoneNumber){
            if( pn.getNumber()==number )
                pn.called();
        })
    }

    @PersistenceAnnotation.Wrap
    collectLeaf()
    {
        this.leaf = this.tree.getLeaves()[0];
    }

}
export = TestPerson;

