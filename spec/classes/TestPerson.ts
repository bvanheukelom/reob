
import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestPerson
{
    name:string;
    gardenState:number;
    _id:string;

    @reob.Type("TestPhoneNumber")
    phoneNumber:Tests.TestPhoneNumber;

    @reob.ArrayOrMap("TestAddress")
    addresses:Array<Tests.TestAddress> = [];

    @reob.Type("TestTree")
        // @omm.AsForeignKeys
    tree:Tests.TestTree;

    @reob.Type("TestTransient")
        // @omm.AsForeignKeys
    testTransient:Tests.TestTransient;

    @reob.Type("TestLeaf")
    // @omm.AsForeignKeys
    leaf:Tests.TestLeaf;

    @reob.ArrayOrMap("TestLeaf")
    trees:Array<Tests.TestTree> = [];

    @reob.ArrayOrMap("TestPhoneNumber")
    phoneBook:{ [index:string]: Tests.TestPhoneNumber } = {};

    @reob.ArrayOrMap("TestTree")
    // @omm.AsForeignKeys
    wood:{ [index:string]: Tests.TestTree } = {};

    @reob.ArrayOrMap("TestPerson")
    // @omm.AsForeignKeys
    family:{ [index:string]: Tests.TestPerson } = {};


    constructor(id?:string, name?:string)
    {
        this.gardenState = 10;
        this._id = id;
        this.name = name;
    }

    getId():string
    {
        return this._id;
    }

    setId( id:string ):void
    {
        this._id = id;
    }



    //rename(n:string):void
    //{
    //    this.name = n;
    //}

    getName():string
    {
        return this.name;
    }

    getAddresses():Array<Tests.TestAddress>
    {
        return this.addresses;
    }

    getTree():Tests.TestTree
    {
        return this.tree;
    }


    @reob.RemoteCollectionUpdate
    collectLeaf()
    {
        //console.log("collecting leaf:",this.tree);
        this.leaf = this.tree.getLeaves()[0];
    }

    @reob.RemoteCollectionUpdate
    chooseTree(t:Tests.TestTree)
    {
        //console.log("choosing tree:",t);
        this.tree = t;
    }
    @reob.RemoteCollectionUpdate
    chooseLeaf(l:Tests.TestLeaf)
    {
        this.leaf = l;
    }

    @reob.CollectionUpdate
    @reob.Remote
    rename(n:string):string {
        this.name = n;
        return this.name;
    }

    @reob.CollectionUpdate
    @reob.Remote
    collectionUpdateRename(n:string):string {
        this.name = "Collection Update:"+n;
        return this.name;
    }

    @reob.CollectionUpdate
    @reob.Remote({parameterTypes:["TestAddress"], replaceWithCall:true})
    addAddress(a:Tests.TestAddress):Tests.TestAddress
    {
        //console.log("inside add address:", (a instanceof Tests.TestAddress));
        this.addresses.push(a);
        return a;
    }

    @reob.CollectionUpdate
    @reob.Remote({parameterTypes:["TestAddress"], replaceWithCall:true})
    addAddresses(addresses:Array<Tests.TestAddress>):Array<Tests.TestAddress>
    {
        var that = this;

        addresses.forEach(function(a:Tests.TestAddress){
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


    @reob.RemoteCollectionUpdate
    addToWood(t:Tests.TestTree, s?:string )
    {
        this.trees.push( t );
        if( s )
            this.wood[s] = t;
    }

    @reob.RemoteCollectionUpdate
    addFamilyRelation(s:string, p:Tests.TestPerson )
    {
        if( s )
            this.family[s] = p;
    }

    @reob.RemoteCollectionUpdate
    addPhoneNumber(s:string, p:Tests.TestPhoneNumber )
    {
        this.phoneBook[s] = p;
    }

    @reob.RemoteCollectionUpdate
    tendToGarden(  ):number
    {
        this.gardenState++;
        this.tree.grow();
        return this.tree.getHeight();
    }

    //@omm.MeteorMethod({replaceWithCall:true})
    //tendToGardenNewStyle():number
    //{
    //    this.gardenState++;
    //    this.tree.grow();
    //    return this.tree.getHeight();
    //}

}
