Meteor.startup(function(){
	if( Meteor.isServer )
	{
		var tc = new BaseCollection(TestTree);
		var tree = new TestTree("t1");
		tree.grow();
		tc.insert(tree);
		debugger;
		var tree2 = tc.getById("t1");

		console.log( "Success:"+(tree2.getLeaves()[0].parent instanceof TestTree));

		// //MeteorPersistence.updatePersistencePaths(tree2);

		console.log(tree);

	}
});