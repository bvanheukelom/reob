///<reference path="../../../../references.d.ts"/>

describe("The persistence thing on the client ", function(){
    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;
    beforeAll(function(){
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
    });


    beforeEach(function(done){
        console.log("------------------- new test");
        omm.BaseCollection.resetAll(function(error){
            if (error)
                fail(error);
            done();
        });
    });

    it("can call wrapped functions", function(done){
        var c = 0;
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            c++;
            expect(c).toBe(1);
            omm.MeteorPersistence.withCallback(function(){
                c++;
                expect(c).toBe(2);
                t.grow();

            }, function(){
                c++;
                expect(c).toBe(3);
                //expect(treeCollection.getById(t.getId())).toBeDefined();
                expect(treeCollection.getById(t.getId()).getLeaves().length).toBe(1);
                expect(treeCollection.getById(t.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
                done();
            });
        });
    });

    it("can return values from a wrapped function", function(done){
        personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson) {
            omm.MeteorPersistence.withCallback(function(){
                held.addAddress(new Tests.TestAddress("streetsss"));
            }, function(e:any, a:Tests.TestAddress){
                expect( a instanceof Tests.TestAddress).toBeTruthy();
                expect( a.getStreet() ).toBe("streetsss");
                done();
            });
        });
    });

    it("serializes and deserializes classes with a custom toDocument and toObject function properly", function(){
        var pn = new Tests.TestPhoneNumber("1212");
        var s = new omm.Serializer(new omm.ConstantObjectRetriever(1));
        var doc:any = s.toDocument(pn);
        expect( doc.freak ).toBe("show");
        expect( doc.pn ).toBe("1212");
        var ob = s.toObject(doc, Tests.TestPhoneNumber);
        expect( ob instanceof Tests.TestPhoneNumber ).toBeTruthy();

    });

    it("calls registered callbacks that receive results from the server ", function(done){
        treeCollection.newTree(24,function(err:any,t1:Tests.TestTree) {
            omm.MeteorPersistence.withCallback(function () {
                var s = t1.grow();
                expect(s).toBeUndefined();
            }, function callback(error, result) {
                expect(result).toBe("grown on the server");
                done();
            });
        });
    });

    it("can call wrapped functions on a subobject", function(done){
        personCollection.newPerson("bert", function(error:any, bert:Tests.TestPerson){
            expect(error).toBeFalsy();
            omm.MeteorPersistence.withCallback(function(){
                bert.addPhoneNumber("max", new Tests.TestPhoneNumber("1234567890"));

            }, function(){
                expect(personCollection.getById(bert.getId()).phoneBook["max"]).toBeDefined();
                omm.MeteorPersistence.withCallback(function() {
                    personCollection.getById(bert.getId()).phoneBook["max"].callNumber();
                },function(err, result){
                    expect( result ).toBe("Calling a phone number : 1234567890");
                    expect(personCollection.getById(bert.getId()).phoneBook["max"]).toBeDefined();
                    done();
                });
            });
        } );
    });


    it("does not lazy load objects within the same root object", function(done){
        personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson){
            omm.MeteorPersistence.withCallback(function(){
                held.addAddress( new Tests.TestAddress("streetname", held));

            }, function(){
                var loadedHeld = personCollection.getById(held.getId());
                expect(loadedHeld.getAddresses()[0]).toBeDefined();
                expect(omm.MeteorPersistence.needsLazyLoading(loadedHeld.getAddresses()[0], "person")).toBeFalsy();
                expect(loadedHeld.getAddresses()[0].person==loadedHeld).toBeTruthy();
                done();
            });
        });
    });

    it("lazy loads objects", function(done){
        personCollection.newPerson( "jake", function( error:any, jake:Tests.TestPerson ){
            treeCollection.newTree(12, function( error, t:Tests.TestTree ){
                omm.MeteorPersistence.withCallback(function(){
                    jake.chooseTree(t);
                }, function(){
                    var loadedJake = personCollection.getById(jake.getId());
                    expect(loadedJake).toBeDefined();
                    expect((<any>loadedJake)._tree).toBeDefined();
                    expect(omm.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeTruthy();
                    //loadedJake.tree;
                    //expect(mapper.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeFalsy();
                    done();
                });
            });
        });
    });

    it("doesnt die if a wrapped call calls another wrapped call within a different collection", function(done){

        personCollection.newPerson("mike", function(e:any, p:Tests.TestPerson){
            treeCollection.newTree( 13, function(e:any, t:Tests.TestTree){
                omm.MeteorPersistence.withCallback(function(){
                    p.chooseTree(t);
                }, function(){
                    omm.MeteorPersistence.withCallback(function(){
                        personCollection.getById(p.getId()).tendToGarden();
                    }, function(err:any, result:number ){
                        expect(result).toBe(14); // tree grew on the server
                        expect(treeCollection.getById(t.getId()).getHeight()).toBe(13); // but that "growing" wasnt persited
                        done();
                    });
                });
            });
        });
    });
});