Meteor.startup(function(){

	if( Meteor.isServer )
	{
		var treeCollection = new TestTreeCollection();
		var personCollection = new TestPersonCollection();
		//personCollection.newPerson( "jake", function( error, jake  ){
		//	treeCollection.newTree(12, function( error, t ){
		//		debugger;
		//		jake.chooseTree(t);
		//		var loadedJake = personCollection.getById(jake.getId());
		//		expect(persistence.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeTruthy();
		//		//loadedJake.tree;
		//		//expect(persistence.MeteorPersistence.needsLazyLoading(loadedJake, "tree") ).toBeFalsy();
		//		done();
		//	});
		//});
	}
});