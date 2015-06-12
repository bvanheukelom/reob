///<reference path="./references.d.ts"/>
module Tests
{
    @omm.Entity
    export class TestPerson
    {
        name:string;
        gardenState:number;
        _id:string;

        @omm.Type("TestPhoneNumber")
        phoneNumber:Tests.TestPhoneNumber;

        @omm.ArrayOrMap("TestAddress")
        addresses:Array<TestAddress> = [];

        @omm.Type("TestTree")
        @omm.AsForeignKeys
        tree:Tests.TestTree;

        @omm.Type("TestLeaf")
        @omm.AsForeignKeys
        leaf:Tests.TestLeaf;

        @omm.ArrayOrMap("TestLeaf")
        @omm.AsForeignKeys
        trees:Array<Tests.TestTree> = [];

        @omm.ArrayOrMap("TestPhoneNumber")
        phoneBook:{ [index:string]: Tests.TestPhoneNumber } = {};

        @omm.ArrayOrMap("TestTree")
        @omm.AsForeignKeys
        wood:{ [index:string]: Tests.TestTree } = {};

        @omm.ArrayOrMap("TestPerson")
        @omm.AsForeignKeys
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


        @omm.Wrap
        addAddress(a:TestAddress):Tests.TestAddress
        {
            console.log("inside add address:", (a instanceof TestAddress));
            this.addresses.push(a);
            return a;
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


        @omm.Wrap
        collectLeaf()
        {
            console.log("collecting leaf:",this.tree);
            this.leaf = this.tree.getLeaves()[0];
        }

        @omm.Wrap
        chooseTree(t:TestTree)
        {
            console.log("choosing tree:",t);
            this.tree = t;
        }
        @omm.Wrap
        chooseLeaf(l:TestLeaf)
        {
            this.leaf = l;
        }
        @omm.Wrap
        addToWood(t:TestTree, s?:string )
        {
            this.trees.push( t );
            if( s )
                this.wood[s] = t;
        }

        @omm.Wrap
        addFamilyRelation(s:string, p:Tests.TestPerson )
        {
            if( s )
                this.family[s] = p;
        }

        @omm.Wrap
        addPhoneNumber(s:string, p:Tests.TestPhoneNumber )
        {
            this.phoneBook[s] = p;
        }

        @omm.Wrap
        tendToGarden(  ):number
        {
            this.gardenState++;
            this.tree.grow();
            return this.tree.getHeight();
        }


    }
}
