Package.describe({
  name: 'bertundmax:mapper',
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
    api.versionsFrom('1.0'); // ??
    api.addFiles('Reflect.js');
    api.addFiles('module.js');
    api.addFiles('Persistable.js');
    api.addFiles('MeteorObjectRetriever.js');
    api.addFiles('ConstantObjectRetriever.js');
    api.addFiles('Document.js');
    api.addFiles('PersistencePath.js');
    api.addFiles('PersistenceAnnotation.js');
    api.addFiles('Serializer.js');
	api.addFiles('MeteorPersistence.js');
	api.addFiles('BaseCollection.js');
	api.export('mapper', 'client');
	api.export('mapper', 'server');
    api.export('DeSerializer', 'client');
    api.export('DeSerializer', 'server');
});



























