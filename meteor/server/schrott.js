Meteor.startup(function(){
	if( Meteor.isServer )
	{
	//	var treeCollection = new BaseCollection(TestTree);
	//	var personCollection = new BaseCollection(TestPerson);
	//
	//	personCollection.getAll().forEach(function(person){
	//		personCollection.remove(person);
	//	});
	//	treeCollection.getAll().forEach(function(tree){
	//		treeCollection.remove(tree);
	//	});
	//debugger;
	//	var t1 = new TestTree("tree1");
	//	treeCollection.insert(t1);
	//	t1.grow();
	//	var tp = new TestPerson("tp");
	//	tp.tree = t1;
	//	personCollection.insert(tp);
	//	tp.collectLeaf();
	//	expect(personCollection.getById("tp").leaf).toBeDefined();
	//	expect(personCollection.getById("tp").leaf.getId()).toBe(t1.getLeaves()[0].getId());
	//
	//	debugger;
	//	console.log(pTest.trees );
	}
});