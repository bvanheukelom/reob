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

});