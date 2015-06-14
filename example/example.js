counterjs:
var Counter = function( name ){
	this.name = name;
	this.clicks = 0;
};

Counter.prototype.inc = function(i){
	this.clicks+=i;
	return this.clicks;
};

omm.addEntity(Counter);
omm.expose(Counter, "inc");


countercollectionjs:

var CounterCollection = function CounterCollection(){
};
CounterCollection.prototype = new omm.Collection(Counter, "counters");
CounterCollection.newCounter = function(){
	var c = new Counter();
	return this.insert( c ); 
};

omm.addMeteorMethod( CounterCollection, "newCounter", {staticId:'counterCollection'} );
omm.meteorCall( CounterCollection, 'newCounter' );



var counterCollection = new CounterCollection();

var c = new Counter('bertcounter');

// on the server
counterCollection.insert( c );

// on the client 

counterCollection.newCounter( function( error, result ){
	if( !error){
		var c = counterCollection.getById(result);
		c.inc(5);
		console.log("counter :"+c.clicks ) // 0
		console.log("counter :"+counterCollection.getById(result).clicks ) // 5
	}
});

counterCollection.newCounter( function( error, counterId ){
	if( !error){
		var c = counterCollection.getById(counterId);
		console.log("counter :"+c.clicks ) // 0
		c.inc(5);
		Meteor.call( "Counter.inc", counterId, 10, function( err, clicks ){
			console.log("counter clicks : "+clicks ) // 15 
		});
	}
});


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

		omm.makeMeteorCall( CounterCollection, "newCounter", { id:"" })

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

This knows everything that was defined by the @omm.meteor.Method annotation therefore the helper can dynamically have the right functions.

How to serialize parameters? By making "className" into something that is a LOT less likely to be hit: "_omm_parameter_type"
