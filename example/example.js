if (Meteor.isClient){

	Template.garden.helpers({
		theGarden: function ()
		{
			var garden = gardenCollection.getById("default");
			return garden;
		}
	});
	Template.garden.events({
		'click #grow': function () {
			Meteor.call("growPlants");
		},
		'click #plant': function () {
			Meteor.call("plant");
		},
		'click #harvest': function () {
			Meteor.call("harvest", this.garden.plants.indexOf(this) );
		}
	});
}

Meteor.methods({
	growPlants:function(){
		var garden = gardenCollection.getById("default");
		garden.growPlants();
	},
	plant:function(){
		var garden = gardenCollection.getById("default");
		garden.addPlant("flower");
	},
	harvest:function(i){
		var garden = gardenCollection.getById("default");
		var plant = garden.plants[i].harvest();
	}

});