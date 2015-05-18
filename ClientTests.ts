///<reference path="references.d.ts"/>

describe("The persistence thing on the client ", function(){
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

    it("can call wrapped functions", function(done){
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            persistence.MeteorPersistence.withCallback(function(){
                t.grow();

            }, function(){
                expect(treeCollection.getById(t.getId())).toBeDefined();
                expect(treeCollection.getById(t.getId()).getLeaves().length).toBe(1);
                expect(treeCollection.getById(t.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
                done();
            });
        });
    });


    it("lazy loads objects", function(done){
        personCollection.newPerson( "jake", function( error:any, jake:Tests.TestPerson ){
            treeCollection.newTree(12, function( error, t:Tests.TestTree ){
                persistence.MeteorPersistence.withCallback(function(){
                    jake.chooseTree(t);

                }, function(){
                    var loadedJake = personCollection.getById(jake.getId());
                    expect(loadedJake).toBeDefined();
                    expect((<any>loadedJake)._tree).toBeDefined();
                    expect(persistence.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeTruthy();
                    //loadedJake.tree;
                    //expect(persistence.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeFalsy();
                    done();
                });
            });
        });
    });

});