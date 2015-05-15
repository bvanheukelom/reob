/**
 * Created by bert on 13.05.15.
 */
///<reference path="references.d.ts"/>
__extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
TestTreeCollection = (function (_super) {
    __extends(TestTreeCollection, _super);
    function TestTreeCollection() {
        _super.call(this, Tests.TestTree);
    }
    TestTreeCollection.prototype.newTree = function (initialHeight, callback) {
        var that = this;
        Meteor.call("newTree", initialHeight, function (error, id) {
            if (!error)
                callback(error, that.getById(id));
            else
                callback(error);
        });
    };
    return TestTreeCollection;
})(persistence.BaseCollection);
Meteor.methods({ newTree: function (initialHeight) {
        check(initialHeight, Match.Integer);
        var t = new Tests.TestTree(initialHeight);
        persistence.BaseCollection.getCollection(Tests.TestTree).insert(t);
    } });
