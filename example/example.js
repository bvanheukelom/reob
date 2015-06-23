<<<<<<< Local Changes
<<<<<<< Local Changes
=======

var Counter = function( name ){
	this.name = name;
	this.clicks = 0;
};

Counter.prototype.inc = function(i){
	this.clicks+=i;
}


omm.addEntity(Counter);
omm.persistChanges(Counter, 'inc');
omm.addMeteorMethod(Counter, 'inc');

var CounterCollection = function(){
}

CounterCollection.prototype = new omm.Collection(Counter);
var counterCollection = new CounterCollection();

var c = new Counter('bertcounter');
counterCollection.insert( c );

// no typechecking
omm.call(c, "inc", p1, p2, p3 function(err, result){
	
});

var promise = omm.callCallOn(c).inc();.then(function());

<<<<<<< Local Changes
c.inc(5);
=======
----------------------------------- annotation -----------------------------------

@omm.CollectionUpdate
	when this function is called omm does an update that will invoke the same function with the same parameters on the stored object with the same Id.

    js api: omm.collectionUpdate( cls, functionName );


omm.register( o, id? )
	
	registers objects that will be used to call functions on.
		If an id is given it will be registered under that id.
		If the object has an id, it will be registered under that id.
		otherwise it will be registred with no id.
		
//@omm.AuditChecks(Match.Boolean, Match.Any)
	
	// tbd

	
----------------------------------- annotation -----------------------------------

@omm.meteor.Method( options? )

	omm will create a meteor method <classname.functionName> (or options.name).
	if the class is an entity the first parameter of the function is the _path of the object.
		if the meteor method is called omm will load the object with the id and call the annotated function on it.
			
	If the class is not an entity the first parameter is the id of the object. so that it can be looked up in the registered objects
			
	if defaultId is given as an option, then it is used and no id parameter is expected. 
			
	js api: omm.addMeteorMethod(Counter, 'inc', options? );

	With this the following calls make sense:

		Meteor.call('Counter.inc', 'bertcounter', 5 );

		// this is kind of ugly
		Meteor.call('CounterCollection.newCounter', 'counterCollectionSingletonId', function(err,result){
		} );

		omm.call( bertCounter, "inc", 5 );
>>>>>>> External Changes

<<<<<<< Local Changes
console.log( counterCollection.getById(c.getId()).clicks );
console.log( c.clicks );
=======
Options 
		static:true
			The function is called without changing the 'this' context.
		
		id:
			This is the id to be used all the time. No id parameter is expected.

		name:
			the meteor method name.

----------------------------------- annotations -----------------------------------

@omm.meteor.ReplaceWithCall (experimental)

	When the function is called, omm will call a meteor method using the given parameters INSTEAD. 
		if the method requires an id parameter it uses ...
			If the object has an id property, the first parameter will be the id.
			If no methodname is given, it will use <classname.functionName>.

		js api: omm.makeMeteorCall( CounterCollection, "newCounter", { id:"" })

@omm.Expose (experimental)
	
	An abreviation for 
		@omm.MeteorMethod
		@omm.MeteorMethodCall
		@omm.CollectionUpdate
		
	js api: omm.expose( cls, functionName )
			
----------------------------------- utils -----------------------------------

// explicit network call = the network call is not transparent
// Encapsulation = the network call is defined where method is declared
// signature checks for typescript
			
omm.callHelper( o, function( error, result ){
	
} ).inc( 5 );

omm.callHelper( CounterCollection, function( error, result ){
	
} ).newCounter();
>>>>>>> External Changes

/*

Problem: 
	OOP breaks if the update is invoked on the object but the object is not changed.

*/

/*
if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
*/>>>>>>> External Changes
=======
>>>>>>> External Changes
