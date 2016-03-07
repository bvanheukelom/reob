///<reference path="../../../../references.d.ts"/>

describe("Omm on the server", function(){
    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;

    beforeAll(function(){
        //jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000000;
    });

    beforeEach(function(done){
        Tests.registeredTestTreeCollection.removeAllListeners();
        omm.removeAllUpdateEventListeners();
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
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
        expect(treeCollection.getById(t1.treeId).getLeaves()[0].getTree() instanceof Tests.TestTree).toBeTruthy();

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
    it("serializes objects that have a parent property properly ", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        var serializer = new omm.Serializer(new omm.MeteorObjectRetriever());
        var doc:any = serializer.toDocument(t1);
        expect(doc.thoseGreenThings[0].tree).toBeUndefined();
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

    it("verifies that updateInProgress is false after an exception happned in the update function", function(){
        var m = new Tests.TestPerson("id1");
        personCollection.insert(m);
        try {
            personCollection.update( "id1", function(){
                expect( omm.MeteorPersistence.updateInProgress ).toBeTruthy();
                throw new Error("someting broke");
            });
            fail();
        }catch( e ){
        }
        expect( omm.MeteorPersistence.updateInProgress ).toBeFalsy();
    });
    it("verifies that updates fail if the id is not given ", function(){
        var m = new Tests.TestPerson("id1");
        personCollection.insert(m);
        try {
            personCollection.update(undefined, function () {
            });
            fail();
        }catch( e ){

        }
    });

    it("invokes didInsert events", function(){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            expect(event.cancelledWithError()).toBeFalsy();
        };
        spyOn(l, 'listener').and.callThrough();
        Tests.registeredTestTreeCollection.onInsert( l.listener );
        treeCollection.newTree(10, function(err,t){

        });
        expect(l.listener).toHaveBeenCalled();
        //fail();
        //done();
    });

    it("can cancel inserts", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            event.cancel("Not allowed");
        };
        spyOn(l, 'listener').and.callThrough();
        Tests.registeredTestTreeCollection.preInsert( l.listener);
        treeCollection.newTree(10, function (err, t) {
            expect(err).toBe("Not allowed");
            expect(treeCollection.getAll().length).toBe(0);
            done();
        });
    });




    it("can handle thrown errors", function(done){

        treeCollection.newTree(10, function (err, t) {
            omm.callHelper(t, function(err, result){
                expect( err ).toBeDefined();
                expect( err instanceof Error ).toBeTruthy();
                done();
            }).thisThrowsAnError();
        });
    });

    it("invokes deletition events", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){

        };
        spyOn(l, 'listener').and.callThrough();
        Tests.registeredTestTreeCollection.onRemove( l.listener );
        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            expect( err ).toBeUndefined();

            treeCollection.deleteTree(t.treeId, function(error){
                expect(error).toBeUndefined();
                expect(l.listener).toHaveBeenCalled();
                done();
            });
        });
    });
    it("can receive emitted events from a subobject", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){

        };
        spyOn(l, 'listener').and.callThrough();
        omm.on( Tests.TestLeaf, "fluttering", l.listener );
        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            expect( err ).toBeUndefined();
            t.grow();
            t = treeCollection.getById(t.treeId);
            expect(l.listener).not.toHaveBeenCalled();
            t.getLeaves()[0].flutter();
            expect(l.listener).toHaveBeenCalled();
            done()
        });
    });
    it("can receive emitted events from a subobject and get the object", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            expect(event.object instanceof Tests.TestLeaf).toBeTruthy();
        };
        spyOn(l, 'listener').and.callThrough();
        omm.on( Tests.TestLeaf, "fluttering", l.listener );
        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            expect( err ).toBeUndefined();
            t.grow();
            t = treeCollection.getById(t.treeId);
            expect(l.listener).not.toHaveBeenCalled();
            t.getLeaves()[0].flutter();
            expect(l.listener).toHaveBeenCalled();
            done()
        });
    });

    it("can return errors in a callback ", function(done){
        treeCollection.errorMethod(10, function (err, t) {
            expect(err).toBe("the error");
            done();
        });
    });

    it("can cancel deletes ", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            event.cancel("nope");
        };
        spyOn(l, 'listener').and.callThrough();
        Tests.registeredTestTreeCollection.preRemove( l.listener );
        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            expect( err ).toBeUndefined();
            treeCollection.deleteTree(t.treeId, function(error){
                expect(error).toBe("nope");
                expect(l.listener).toHaveBeenCalled();
                expect(treeCollection.getById(t.treeId)).toBeDefined();
                done();
            });
        });
    });

    it("can register for pre update events", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            expect(event.object).toBeDefined();
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            var tt:Tests.TestTree = event.object;
            expect(tt.getLeaves().length).toBe( 0 );
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate( Tests.TestTree, "grow", l.listener  );

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(err).toBeUndefined();
                expect(result).toBe( "grown on the server" );
                expect(l.listener).toHaveBeenCalled();
                done();
            }).grow();
        });
    });

    it("can cancel updates on a subobject in a generic listener", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            event.cancel("not happening");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate( Tests.TestTree, l.listener  );

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(err).toBe("not happening");
                expect(l.listener).toHaveBeenCalled();
                done();
            }).grow();
        });
    });

    it("can cancel updates on a subobject in a generic listener on a subobject", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            event.cancel("not happening either");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate( Tests.TestLeaf, l.listener  );

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(err).toBeUndefined();
                var t2 = treeCollection.getById(t.treeId);
                omm.callHelper(t2.getLeaves()[0],function(err,result){
                    expect(err).toBe("not happening either");
                    expect(l.listener).toHaveBeenCalled();
                    done();
                }).flutter();
            }).grow();
        });
    });


    it("can register for post update events", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            expect(event.object).toBeDefined();
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            var tt:Tests.TestTree = event.object;
            expect(tt.getLeaves().length).toBe( 1 );
        };
        spyOn(l, 'listener').and.callThrough();
        omm.onUpdate( Tests.TestTree, "grow", l.listener );
        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(err).toBeUndefined();
                expect(result).toBe( "grown on the server" );
                expect(l.listener).toHaveBeenCalled();
                var nt = treeCollection.getById(t.treeId);
                expect(nt.getLeaves().length).toBe(1);
                done();
            }).grow();
        });
    });

    it("can cancel updates", function(done){
        var l:any = {};
        l.listener = function(event:omm.EventContext<Tests.TestTree>){
            event.cancel("nope");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate( Tests.TestTree, "grow", l.listener );

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(err).toBe("nope");
                expect(result).toBeUndefined();
                expect(l.listener).toHaveBeenCalled();
                var nt = treeCollection.getById(t.treeId);
                expect(nt.getLeaves().length).toBe(0);
                done();
            }).grow();
        });
    });

    it("can register to update events", function(done){
        var l:any = {};
        var n:Array<string> = [];
        l.listener = function(event:omm.EventContext<Tests.TestTree>, data:any){
            n.push(data);
        };
        spyOn(l, 'listener').and.callThrough();

        omm.on( Tests.TestTree, "gardenevents", l.listener );

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(l.listener).toHaveBeenCalled();
                expect(n).toContain("withered");
                expect(n).toContain("withered2");
                done();
            }).wither();
        });
    });

    it("can register to all update events", function(done){
        var l:any = {};
        var n:Array<string> = [];
        l.listener = function(event:omm.EventContext<Tests.TestTree>, data:any){
            n.push(data);
        };
        spyOn(l, 'listener').and.callThrough();

        omm.on(Tests.TestTree, "preSave", l.listener);

        treeCollection.newTree(10, function (err, t:Tests.TestTree) {
            omm.callHelper(t, function(err, result){
                expect(l.listener).toHaveBeenCalled();
                done();
            }).wither();
        });
    });

});