///<reference path="../../../../../../../references.d.ts"/>

describe("The persistence thing on the server", function(){
    var personCollection:TestPersonCollection;
    var treeCollection:TestTreeCollection;
    beforeAll(function(){
        personCollection = new TestPersonCollection();
        treeCollection = new TestTreeCollection();
    });


    beforeEach(function(done){
        console.log("------------------- new test");
        mapper.BaseCollection.resetAll(function(error){
            if (!error)
                done();
            else
                fail(error);
        });
    });

    it("can load objects that have sub objects", function(){
        var t1:Tests.TestPerson = new Tests.TestPerson("t444");
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        var id = personCollection.insert(t1);
        expect(id).toBe("t444");
        expect(personCollection.getById("t444")).toBeDefined();
        expect(personCollection.getById("t444").phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
    });

    it("can load objects that have sub objects (in an array) which have a parent reference ", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        treeCollection.insert(t1);
        t1.grow();
        expect(treeCollection.getById(t1.getId())).toBeDefined();
        expect(treeCollection.getById(t1.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();

    });

    it("can save objects that have sub objects (in an array) which have a parent reference", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById(t1.getId())).toBeDefined();
        expect(treeCollection.getById(t1.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();

    });

    it("can call wrapped functions", function(done){
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            t.grow();
            expect(treeCollection.getById(t.getId())).toBeDefined();
            expect(treeCollection.getById(t.getId()).getLeaves().length).toBe(1);
            expect(treeCollection.getById(t.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            done();
        });
    });

    it("can save an array of foreign ids", function(){
        var p1:Tests.TestPerson = new Tests.TestPerson("p1");

        var t1:Tests.TestTree = new Tests.TestTree(10);
        treeCollection.insert(t1);
        var t2:Tests.TestTree = new Tests.TestTree(10);
        treeCollection.insert(t2);
        var t3:Tests.TestTree = new Tests.TestTree(10);
        treeCollection.insert(t3);

        p1.trees.push(t1);
        p1.trees.push(t2);
        p1.trees.push(t3);
        personCollection.insert(p1);

        expect(personCollection.getById("p1").trees).toBeDefined();
        expect(Array.isArray( personCollection.getById("p1").trees )).toBeTruthy();
        expect( personCollection.getById("p1").trees[1].getId()).toBe(t2.getId());
    });


});