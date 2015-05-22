Package.describe({
  name: 'bertundmax:omm',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

// todo make this depend on reflect-metadata rather than to include it

Package.onUse(function(api) {
    api.versionsFrom('1.0'); // ??
    api.addFiles('Reflect.js');
    api.addFiles('omm.js');
	api.export('Reflect', 'client');
	api.export('Reflect', 'server');
	api.export('omm', 'client');
	api.export('omm', 'server');
	api.export('DeSerializer', 'client');
    api.export('DeSerializer', 'server');
});


































