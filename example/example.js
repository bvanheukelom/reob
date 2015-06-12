
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

c.inc(5);

console.log( counterCollection.getById(c.getId()).clicks );
console.log( c.clicks );

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
*/