module.exports = function (grunt) {

	// GRUNT CONFIGURATION
	grunt.initConfig({
		watch: {
			files: ["**/*.ts"],
			tasks: ["ts","copyCode"]
		},
		ts: {
			default : {
				src: ["**/*.ts", "!node_modules/**/*.ts"],
				options:{
					compiler:"/usr/local/bin/tsc"
				}
			}

		}
	});

	// NPM TASKS
	grunt.loadNpmTasks("grunt-ts-1.5");
	grunt.loadNpmTasks("grunt-nodemon");
	grunt.loadNpmTasks("grunt-concurrent");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jasmine-node-coverage');

	// CUSTOM TASKS
	grunt.registerTask("copyCode", "Copies all necessary files", function () {
		grunt.file.copy("meteor/tests/jasmine/Tests.js", "meteor/tests/jasmine/client/integration/sample/src/Tests.js");
		grunt.file.copy("meteor/tests/jasmine/Tests.js", "meteor/tests/jasmine/server/integration/sample/src/Tests.js");
	});

};