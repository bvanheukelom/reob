///<reference path="references.d.ts"/>
describe("The persistence thing on the client ", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function () {
        personCollection = new TestPersonCollection();
        treeCollection = new TestTreeCollection();
    });
    beforeEach(function (done) {
        console.log("------------------- new test");
        persistence.BaseCollection.resetAll(function (error) {
            if (!error)
                done();
            else
                fail(error);
        });
    });
    it("can call wrapped functions", function (done) {
        treeCollection.newTree(24, function (err, t) {
            persistence.MeteorPersistence.withCallback(function () {
                t.grow();
            }, function () {
                expect(treeCollection.getById(t.getId())).toBeDefined();
                expect(treeCollection.getById(t.getId()).getLeaves().length).toBe(1);
                expect(treeCollection.getById(t.getId()).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
                done();
            });
        });
    });
    it("lazy loads objects", function (done) {
        personCollection.newPerson("jake", function (error, jake) {
            treeCollection.newTree(12, function (error, t) {
                persistence.MeteorPersistence.withCallback(function () {
                    jake.chooseTree(t);
                }, function () {
                    var loadedJake = personCollection.getById(jake.getId());
                    expect(loadedJake).toBeDefined();
                    expect(loadedJake._tree).toBeDefined();
                    expect(persistence.MeteorPersistence.needsLazyLoading(loadedJake, "tree")).toBeTruthy();
                    done();
                });
            });
        });
    });
});
