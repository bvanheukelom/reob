/**
 * Created by bert on 04.05.15.
 */
import PersistenceAnnotation = require( "./PersistenceAnnotation" );
import TestPhoneNumber = require("./TestPhoneNumber");
import TestTree = require("./TestTree");
import TestLeaf = require("./TestLeaf");
import TestAddress = require("./TestAddress");

@PersistenceAnnotation.Entity(true)
class TestPerson
{
    name:string;
    _id:string;

    @PersistenceAnnotation.Type("TestPhoneNumber")
    phoneNumber:TestPhoneNumber;

    @PersistenceAnnotation.Type("TestAddress")
    private addresses:Array<TestAddress> = [];

    @PersistenceAnnotation.Type("TestTree")
    @PersistenceAnnotation.AsForeignKeys
    tree:TestTree;

    @PersistenceAnnotation.Type("TestLeaf")
    @PersistenceAnnotation.AsForeignKeys
    leaf:TestLeaf;

    @PersistenceAnnotation.Collection("TestLeaf")
    @PersistenceAnnotation.AsForeignKeys
    trees:Array<TestTree> = [];

    @PersistenceAnnotation.Collection("TestPhoneNumber")
    phoneBook:{ [index:string]: TestPhoneNumber } = {};


    constructor(id?:string, name?:string)
    {
        this._id = id;
        this.name = name;
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

    getName():string
    {
        return this.name;
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


    @PersistenceAnnotation.Wrap
    collectLeaf()
    {
        this.leaf = this.tree.getLeaves()[0];
    }

}
export = TestPerson;

