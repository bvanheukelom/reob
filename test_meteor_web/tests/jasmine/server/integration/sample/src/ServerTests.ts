///<reference path="../../../../references.d.ts"/>

describe("The persistence thing on the server", function(){
    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;
    beforeAll(function(){
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
    });


    beforeEach(function(done){
        console.log("------------------- new test");
        omm.Collection.resetAll(function(error){
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
        expect(treeCollection.getById(t1.treeId)).toBeDefined();
        expect(treeCollection.getById(t1.treeId).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();

    });

    it("can save objects that have sub objects (in an array) which have a parent reference", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById(t1.treeId)).toBeDefined();
        expect(treeCollection.getById(t1.treeId).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });

    it("can call wrapped functions", function(done){
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            t.grow();
            expect(treeCollection.getById(t.treeId)).toBeDefined();
            expect(treeCollection.getById(t.treeId).getLeaves().length).toBe(1);
            expect(treeCollection.getById(t.treeId).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
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
        expect( personCollection.getById("p1").trees[1].treeId).toBe(t2.treeId);
    });

    it("can store objects as foreign keys that are an arrayOrMap entry and do not have an id", function(){
        var m = new Tests.TestPerson("id1");
        m.addresses.push(new Tests.TestAddress("jockeh str.1"));
        personCollection.insert(m);
        var tree = new Tests.TestTree(347);
        tree.address = m.getAddresses()[0];
        var serializer = new omm.Serializer(new omm.MeteorObjectRetriever());
        var doc:any = serializer.toDocument(tree);
        expect(doc.address).toBe('TestPerson[id1].addresses|0');
        treeCollection.insert(tree);
        var t2 = treeCollection.getById(tree.treeId);
        expect(t2.address instanceof Tests.TestAddress).toBeTruthy();
        expect(t2.address.getStreet()).toBe("jockeh str.1");
    });
});