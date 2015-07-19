Package.describe({
  name: 'bertundmax:omm',
  version: '0.0.9',
  // Brief, one-line summary of the package.
  summary: 'Object meteor mapper. Maps between rich objects and documents.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/bvanheukelom/omm',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

// todo make this depend on reflect-metadata rather than to include it

Package.onUse(function(api) {
    api.versionsFrom('1.0'); // ??
	api.addFiles('serializer/Document.js');
	api.addFiles('annotations/PersistenceAnnotation.js');
	api.addFiles('annotations/TypeClass.js');

	api.addFiles('serializer/ConstantObjectRetriever.js');
	api.addFiles('serializer/Document.js');
	api.addFiles('serializer/LocalObjectRetriever.js');
	api.addFiles('serializer/ObjectRetriever.js');
	api.addFiles('serializer/Serializer.js');
	api.addFiles('serializer/SubObjectPath.js');

	api.addFiles('omm/MeteorPersistence.js');
	api.addFiles('omm/Collection.js');
	api.addFiles('omm/MeteorObjectRetriever.js');
	api.addFiles('omm/SerializationPath.js');

	api.export('omm', 'client');
	api.export('omm', 'server');
});


































