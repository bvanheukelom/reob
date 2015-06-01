Package.describe({
	name: 'bertundmax:testclasses',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.1.0.2');
	api.use('bertundmax:omm',"server");
	api.use('bertundmax:omm',"client");
	api.addFiles('TestAddress.js');
	api.addFiles('TestLeaf.js');
	api.addFiles('TestPerson.js');
	api.addFiles('TestPersonCollection.js');
	api.addFiles('TestPhoneNumber.js');
	api.addFiles('TestCar.js');
	api.addFiles('TestWheel.js');
	api.addFiles('TestTree.js');
	api.addFiles('TestTreeCollection.js');
	api.export('Tests', 'server');
	api.export('Tests', 'client');
});
