/**
 * Created by bert on 03.05.15.
 */
__extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
PersonCollection = (function (_super) {
    __extends(PersonCollection, _super);
    function PersonCollection() {
        _super.call(this, TestPerson);
    }
    PersonCollection.prototype.findByName = function (n) {
        var arr = this.find({
            name: n
        });
        return arr.length > 0 ? arr[0] : undefined;
    };
    return PersonCollection;
})(BaseCollection);
//var treeCollection = new BaseCollection(TestTree);
//var personCollection = new PersonCollection();
//treeCollection.getAll().forEach(function(tree){
//    treeCollection.remove(tree);
//});
//personCollection.getAll().forEach(function(p){
//    personCollection.remove(p);
//});
//
//var tree1:TestTree = new TestTree("tree__");
//treeCollection.insert(tree1);
//
//var tp = new TestPerson("tp1","bert");
//tp.tree = tree1;
//personCollection.insert(tp); // tree is stored as id
//console.error(personCollection.getById("tp1").tree instanceof TestTree);
