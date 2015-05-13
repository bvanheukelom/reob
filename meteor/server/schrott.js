Meteor.startup(function(){

	if( Meteor.isServer )
	{
		var treeCollection = new persistence.BaseCollection(Tests.TestTree);
		var personCollection = new persistence.BaseCollection(Tests.TestPerson);

		personCollection.getMeteorCollection().remove({});
		treeCollection.getMeteorCollection().remove({});

		var t1 = new Tests.TestPerson("p1");
		t1.phoneBook["mike"] = new Tests.TestPhoneNumber("12345 ");
		personCollection.insert(t1);
		var t2 = personCollection.getById("p1");
		t2.phoneBook["mike"].callNumber(function(err,  r){
			console.log("async result "+r);
		});
	}
});