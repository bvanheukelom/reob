Meteor.startup(function(){

	if( Meteor.isServer )
	{
		var treeCollection = new persistence.BaseCollection(Tests.TestTree);
		var personCollection = new persistence.BaseCollection(Tests.TestPerson);
		//
		personCollection.getMeteorCollection().remove({});
		treeCollection.getMeteorCollection().remove({});
		//
		var t1 = new Tests.TestTree("tree1");
		debugger;

		treeCollection.insert(t1);
		debugger;
		t1.grow();
		debugger;
		//expect(treeCollection.getById("tree1")).toBeDefined();
		//expect(treeCollection.getById("tree1").getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
	}
});