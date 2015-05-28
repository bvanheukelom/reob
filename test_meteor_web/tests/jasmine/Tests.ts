///<reference path="./references.d.ts"/>

describe("The persistence thing", function(){
    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;
    beforeAll(function(done){
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
        done();
    });

    beforeEach(function(done){
        console.log("------------------- new test");
        omm.BaseCollection.resetAll(function(error){
            if (error)
                fail(error);
            done();
        });
    });

    it( "knows the difference between root entities and subdocument entities ", function(){
        expect( omm.PersistenceAnnotation.getCollectionName(Tests.TestPerson) ).toBe("TestPerson");
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestPerson) ).toBeTruthy();
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestTree) ).toBeTruthy();
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestLeaf) ).toBeFalsy();
    });

    it( "knows the name of collections", function(){
        expect( personCollection.getName() ).toBe("TestPerson");
        expect( treeCollection.getName() ).toBe("TheTreeCollection");
    });

    it( "knows the difference between root entities and subdocument entities ", function(){
        expect( omm.PersistenceAnnotation.getCollectionName(Tests.TestPerson) ).toBe("TestPerson");
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestPerson) ).toBeTruthy();
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestTree) ).toBeTruthy();
        expect( omm.PersistenceAnnotation.isRootEntity(Tests.TestLeaf) ).toBeFalsy();
    });

    it( "knows types ", function(){
        expect( omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "tree") ).toBe(Tests.TestTree);
        expect( omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "leaf") ).toBe(Tests.TestLeaf);
    });


    function onlyOnce( f:Function ):any
    {
        var counter = 0;
        return function(){
            if( counter>0 ) {
                throw new Error("Function called twice");
            }
            counter = 1;
            f.apply(this,arguments);
        }
    }

    it("can do basic inserts", function( done ){
        treeCollection.newTree( 20, onlyOnce(function(error, tree:Tests.TestTree){
            expect( error ).toBeUndefined();
            expect( tree ).toBeDefined();
            expect( (<any>tree).persistencePath ).toBeDefined();
            expect( tree instanceof Tests.TestTree).toBeTruthy();
            expect( tree.getId()).toBeDefined();
            expect( tree.getHeight()).toBe(20);
            expect( treeCollection.getById(tree.getId())).toBeDefined();
            expect( treeCollection.getById(tree.getId()).getId()).toBeDefined();
            expect( treeCollection.getById(tree.getId()).getHeight()).toBe(20);
            done();
        }));
    });

    it("can call server functions", function( done ){
        var c = 0;
        treeCollection.serverFunction("World", new Tests.TestTree(212), 42, onlyOnce(function(e:any,s:string){
            c++;
            if( c>1 )
                fail("executed more than once");

            expect( s ).toBe( "Hello World! This is on the server t:true 212 n:42 number" );
            expect(e).toBeUndefined();
            done();
        }));
    });

    it("can monkey patch functions", function( ){
        var f = function f(){
            this.c = 0;
        };
        f.prototype.hello = function(p){
            this.c+=p;
        };
        omm.MeteorPersistence.monkeyPatch(f.prototype, "hello", function( original, p ){
            expect(this.c).toBe(0);
            this.c++;
            original.call(this, p);

        });
        var x:any = new f();
        x.hello(20);
        expect( x.c ).toBe(21)
    });

    it("uses persistence paths to return undefined for non existent subobjects ", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var pp:omm.PersistencePath = new omm.PersistencePath("TestTree", "tree1");
        pp.appendArrayOrMapLookup("leaves", "nonexistentLeaf");
        expect( pp.getSubObject(t1) ).toBeUndefined();
    });

    it("can do basic removes", function(done){
        treeCollection.newTree(20,function(err, t:Tests.TestTree){

            expect( treeCollection.getById(t.getId())).toBeDefined();
            treeCollection.deleteTree(t.getId(), function(err){
                expect( treeCollection.getById(t.getId())).toBeUndefined();
                done();
            });
        });
    });
    //
    it("uses persistence paths on root documents", function(){
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.setId("tree1");
        t1.grow();
        omm.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1["persistencePath"]).toBeDefined();
        expect(t1["persistencePath"].toString()).toBe("TheTreeCollection[tree1]");
    });

    it("uses persistence paths on sub documents", function(){
        var tp:Tests.TestPerson = new Tests.TestPerson("tp1");
        tp.phoneNumber = new Tests.TestPhoneNumber("12345");
        omm.MeteorPersistence.updatePersistencePaths(tp);
        expect(tp.phoneNumber["persistencePath"]).toBeDefined();
        expect(tp.phoneNumber["persistencePath"].toString()).toBe("TestPerson[tp1].phoneNumber");
    });

    it("can call wrapped functions that are not part of a collection", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });

    it("uses persistence paths on subdocuments in arrays", function(){
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.setId("tree1");
        t1.grow();
        omm.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1.getLeaves().length).toBe(1);
        expect(t1.getLeaves()[0]["persistencePath"]).toBeDefined();
        expect(t1.getLeaves()[0]["persistencePath"].toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });

    it("serializes basic objects", function(){
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new omm.Serializer( new omm.MeteorObjectRetriever() ).toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["pn"]).toBe("12345");
    });

    it("deserializes basic objects", function(){
        var serializer:omm.Serializer = new omm.Serializer( new omm.MeteorObjectRetriever() );
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1:Tests.TestPerson = serializer.toObject(doc, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });

    it("deserializes objects that have subobjects", function(){
        var serializer:omm.Serializer = new omm.Serializer( new omm.MeteorObjectRetriever() );
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.setId("t1");
        t1.grow();
        var doc = serializer.toDocument(t1);
        var t1:Tests.TestTree = serializer.toObject(doc, Tests.TestTree);
        expect(t1.getId()).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });

    it("reoves all", function(){
        expect(true).toBeTruthy();
    });

    // test that properties that need lazy loading are not loaded during serialization

    it("can use persistence paths on objects that have foreign key properties", function(){
        var t1:Tests.TestTree = new Tests.TestTree(12);
        t1.setId("dfdf");
        var tp:Tests.TestPerson = new Tests.TestPerson("tp");
        tp.tree = t1;
        omm.MeteorPersistence.updatePersistencePaths(tp);
    });

    it("can serialize objects that have foreign key properties", function(){
        var t1:Tests.TestTree = new Tests.TestTree(122);
        t1.setId( "tree1" );
        var tp:Tests.TestPerson = new Tests.TestPerson("tp");
        tp.tree = t1;
        var doc = new omm.Serializer( new omm.MeteorObjectRetriever() ).toDocument(tp);
        expect( doc["tree"] ).toBe("TheTreeCollection[tree1]");
    });

    it("can save objects that have foreign key properties", function(done){
        personCollection.newPerson( "jake", function( error:any, jake:Tests.TestPerson ){
            expect(error).toBeFalsy();
            expect(jake).toBeDefined();
            treeCollection.newTree(12, function( error, t:Tests.TestTree ){
                jake.chooseTree(t);
                var loadedJake = personCollection.getById(jake.getId());
                expect(loadedJake).toBeDefined();
                expect(loadedJake.tree).toBeDefined();
                done();
            });
        });
    });
    //
    //
    it("can save objects that have subobjects which are subobjects of other root objects", function(done){
        var c = 0;
        treeCollection.newTree(10,function(err,t:Tests.TestTree){
            c++;
            expect(c).toBe(1);
            //expect(t).toBeDefined();
            t.grow();
            personCollection.newPerson("girl", function(err,tp:Tests.TestPerson){
                c++;
                if( c!=2 )
                    debugger;
                expect(c).toBe(2);
                tp.chooseTree(t);
                tp.collectLeaf();
                expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
                expect(personCollection.getById(tp.getId()).leaf.getId()+"!").toBe(treeCollection.getById(t.getId()).getLeaves()[0].getId()+"!");
                done();
            });
        });
    });

    it("can save objects that have subobjects which are one of many elements in a subobject-array of another root object", function(done){
        var c = 0;
        treeCollection.newTree(10,function(err,t1:Tests.TestTree) {
            c++;
            if( c>1 )
                fail();
            //expect(t1).toBeDefined();
            for (var i = 0; i < 10; i++)
                t1.grow();
            t1 = treeCollection.getById(t1.getId());
            expect( t1.getLeaves().length).toBe(10);
            personCollection.newPerson("girl", function (err, tp:Tests.TestPerson) {
                c++;
                if( c>2 )
                    fail();
                expect( t1.getLeaves()[5]).toBeDefined();
                tp.chooseLeaf(t1.getLeaves()[5]);
                expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
                //expect(personCollection.getById(tp.getId()).leaf.getId()).toBe(t1.getLeaves()[5].getId());
                //expect(personCollection.getById(tp.getId()).leaf.greenNess).toBe(t1.getLeaves()[5].greenNess);
                done();
            });
        });

    });

    it("can serialize object in a map", function(){
        var tp = new Tests.TestPerson("tp");
        tp.phoneBook["klaus"] = new Tests.TestPhoneNumber("121212");
        var doc:any = new omm.Serializer(new omm.ConstantObjectRetriever(1) ).toDocument(tp);

        expect( doc ).toBeDefined();
        expect( doc.phoneBook ).toBeDefined();
        expect( doc.phoneBook["klaus"] ).toBeDefined();
        expect( doc.phoneBook["klaus"].pn ).toBeDefined();
    });

    it("can serialize object in a map as foreign key", function(done){
        treeCollection.newTree(12, function(e:any, klaus:Tests.TestTree){
            treeCollection.newTree(13, function(e:any, peter:Tests.TestTree){
                personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson){
                    held.addToWood(klaus,"xxx");
                    held.addToWood(peter, "yyy");
                    held = personCollection.getById(held.getId());
                    var doc:any = new omm.Serializer(new omm.MeteorObjectRetriever() ).toDocument(held);
                    expect( doc ).toBeDefined();
                    expect( doc.wood ).toBeDefined();
                    expect( doc.wood["xxx"] ).toBeDefined();
                    expect( doc.wood["xxx"] ).toBe("TheTreeCollection["+klaus.getId()+"]");
                    expect( doc.wood["yyy"] ).toBe("TheTreeCollection["+peter.getId()+"]");
                    done();
                });
            });
        });
    });


    it("can save foreign keys in a map", function(done){
        treeCollection.newTree(12, function(e:any, klaus:Tests.TestTree){
            treeCollection.newTree(13, function(e:any, peter:Tests.TestTree){
                personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson){
                    held.addToWood(klaus,"klausKey");
                    held.addToWood(peter, "peterKey");
                    held = personCollection.getById(held.getId());
                    expect( held ).toBeDefined();
                    expect( omm.MeteorPersistence.needsLazyLoading(held,"wood") ).toBeTruthy();
                    expect( held.wood ).toBeDefined();
                    expect( omm.MeteorPersistence.needsLazyLoading(held,"wood") ).toBeFalsy();
                    expect( typeof held.wood ).toBe("object");
                    expect( held.wood["peterKey"] ).toBeDefined();
                    expect( held.wood["peterKey"] instanceof Tests.TestTree ).toBeTruthy();
                    expect( held.wood["peterKey"].getId() ).toBe(peter.getId());
                    done();
                });
            });
        });
    });
    //
    //it("can save objects keys in a map", function(){
    //    var tp = new Tests.TestPerson("tp");
    //    tp.phoneBook["ernie"] = new Tests.TestPhoneNumber("333");
    //    tp.phoneBook["cookie monster"] = new Tests.TestPhoneNumber("444");
    //    tp.phoneBook["superman"] = new Tests.TestPhoneNumber("12345");
    //    personCollection.insert( tp );
    //
    //    expect( personCollection.getById("tp") ).toBeDefined();
    //    expect( mapper.MeteorPersistence.needsLazyLoading(personCollection.getById("tp"), "wood")).toBeFalsy();
    //    expect( personCollection.getById("tp").phoneBook ).toBeDefined();
    //    expect( typeof personCollection.getById("tp").phoneBook ).toBe("object");
    //    expect( personCollection.getById("tp").phoneBook["superman"] ).toBeDefined();
    //    expect( personCollection.getById("tp").phoneBook["superman"] instanceof Tests.TestPhoneNumber ).toBeTruthy();
    //    expect( personCollection.getById("tp").phoneBook["superman"].getNumber() ).toBe("12345");
    //});
    //
    it("can save objects with a dictionary to objects in the same collection", function(done){
        personCollection.newPerson("mom", function(e:any, mom:Tests.TestPerson){
            personCollection.newPerson("dad", function(e:any, dad:Tests.TestPerson) {
                personCollection.haveBaby(mom, dad, function(e:any, kid:Tests.TestPerson) {
                    expect( personCollection.getById(kid.getId()).family["mom"].getId() ).toBe(mom.getId());
                    expect( personCollection.getById(kid.getId()).family["dad"].getId() ).toBe(dad.getId());
                    done();
                });
            });
        });
    });
    //
    //

    //
    it("stores something as a foreign key turns undefined after the foreign object is deleted", function(done){
        personCollection.newPerson("mom", function(e:any, mom:Tests.TestPerson){
            personCollection.newPerson("dad", function(e:any, dad:Tests.TestPerson) {
                personCollection.haveBaby(mom, dad, function(e:any, kid:Tests.TestPerson) {
                    expect( personCollection.getById(kid.getId()).family["mom"].getId() ).toBe(mom.getId());
                    expect( personCollection.getById(kid.getId()).family["dad"].getId() ).toBe(dad.getId());
                    personCollection.removePerson( mom.getId(), function(e:any) { // how sad
                        expect( personCollection.getById(kid.getId()).family["mom"] ).toBeUndefined();
                        done();
                    });
                });
            });
        });
    });
    //
    //
    it("stores something as a foreign key turns undefined after the foreign sub object is deleted", function(done){
        treeCollection.newTree( 10, function(e:any, t:Tests.TestTree){
            t.grow();
            personCollection.newPerson("mike", function(e:any, p:Tests.TestPerson){
                p.chooseTree(t);
                p.collectLeaf();
                expect( personCollection.getById(p.getId()).leaf ).toBeDefined();
                t.wither();
                expect( personCollection.getById(p.getId()).leaf ).toBeUndefined();
                done();
            });
        });
    });

    it("serializes the classname of unexpected objects", function(){
        var t:Tests.TestPerson = new Tests.TestPerson("id1", "jake");
        t.addresses.push( <any>new Tests.TestLeaf("leafId1"));
        var doc = new omm.Serializer(new omm.ConstantObjectRetriever(1)).toDocument(t);
        expect(doc["addresses"][0].className).toBe("TestLeaf");
        expect(doc["addresses"][0]._id).toBe("leafId1");
    });

    it("deserializes unexpected objects", function(){
        var t:Tests.TestPerson = new Tests.TestPerson("id1", "jake");
        t.addresses.push( <any>new Tests.TestLeaf("leafId1"));
        var s = new omm.Serializer(new omm.ConstantObjectRetriever(1));
        var doc = s.toDocument(t);
        var o:any = s.toObject(doc, Tests.TestPerson);
        expect( o instanceof  Tests.TestPerson).toBeTruthy();
        expect( o.addresses[0] instanceof Tests.TestLeaf).toBeTruthy();
    });

    //xit("offers a way to annotate wrapped calls as 'performed on the server'.", function() {
    //});



    // write test that verifies that once a

});