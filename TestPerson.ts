///<reference path="references.d.ts"/>
module Tests
{
    @mapper.Entity(true)
    export class TestPerson
    {
        name:string;
        _id:string;

        @mapper.Type("TestPhoneNumber")
        phoneNumber:Tests.TestPhoneNumber;

        @mapper.ArrayOrMap("TestAddress")
        private addresses:Array<TestAddress> = [];

        @mapper.Type("TestTree")
        @mapper.AsForeignKeys
        tree:Tests.TestTree;

        @mapper.Type("TestLeaf")
        @mapper.AsForeignKeys
        leaf:Tests.TestLeaf;

        @mapper.ArrayOrMap("TestLeaf")
        @mapper.AsForeignKeys
        trees:Array<Tests.TestTree> = [];

        @mapper.ArrayOrMap("TestPhoneNumber")
        phoneBook:{ [index:string]: Tests.TestPhoneNumber } = {};

        @mapper.ArrayOrMap("TestTree")
        @mapper.AsForeignKeys
        wood:{ [index:string]: Tests.TestTree } = {};


        @mapper.ArrayOrMap("TestPerson")
        @mapper.AsForeignKeys
        family:{ [index:string]: Tests.TestPerson } = {};


        constructor(id?:string, name?:string)
        {
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


        @mapper.Wrap
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


        @mapper.Wrap
        collectLeaf()
        {
            console.log("collecting leaf:",this.tree);
            this.leaf = this.tree.getLeaves()[0];
        }

        @mapper.Wrap
        chooseTree(t:TestTree)
        {
            console.log("choosing tree:",t);
            this.tree = t;
        }
        @mapper.Wrap
        chooseLeaf(l:TestLeaf)
        {
            this.leaf = l;
        }
        @mapper.Wrap
        addToWood(t:TestTree, s?:string )
        {
            this.trees.push( t );
            if( s )
                this.wood[s] = t;
        }

        @mapper.Wrap
        addFamilyRelation(s:string, p:Tests.TestPerson )
        {
            if( s )
                this.family[s] = p;
        }

        @mapper.Wrap
        addPhoneNumber(s:string, p:Tests.TestPhoneNumber )
        {
            this.phoneBook[s] = p;
        }


    }
}
