///<reference path="references.d.ts"/>

describe("The persistence thing on the server", function(){
    var personCollection:TestPersonCollection;
    var treeCollection:TestTreeCollection;
    beforeAll(function(){
        personCollection = new TestPersonCollection();
        treeCollection = new TestTreeCollection();
    });


    beforeEach(function(done){
        console.log("------------------- new test");
        persistence.BaseCollection.resetAll(function(error){
            if (!error)
                done();
            else
                fail(error);
        });
    });

    it("can load objects that have sub objects", function(done){
        var t1:Tests.TestPerson = new Tests.TestPerson("t444");
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        personCollection.insert(t1, function( err:any, id:string){
            expect(id).toBe("t444");
            expect(personCollection.getById("t444")).toBeDefined();
            expect(personCollection.getById("t444").phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
            done();
        });
    });

    it("can load objects that have sub objects (in an array) which have a parent reference", function(done){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.setId("tree1");
        t1.grow();
        treeCollection.insert(t1, function( err:any, id:string){
            expect(treeCollection.getById(id)).toBeDefined();
            expect(treeCollection.getById(id).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            done();
        });
    });

});