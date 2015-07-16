GardenCollection = function(){

};
GardenCollection.prototype = Object.create( new omm.Collection(Garden) );

gardenCollection = new GardenCollection();

if( Meteor.isServer ){
	Meteor.startup(function(){
		if( !gardenCollection.getById("default") ){
			gardenCollection.insert( new Garden("The default garden", "default") );
		}
	});
}
