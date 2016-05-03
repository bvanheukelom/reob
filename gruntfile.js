module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	grunt.initConfig({
		watch: {
			files: ["test_meteor_web/**/*.ts"],
			tasks: ["default"]
		},
		clean: { files:[
			"testweb/node_modules/omm/build",
			"testweb/node_modules/omm/src/**/*.js*",
			"testweb/node_modules/omm/src/**/*.d.ts",
			"testweb/node_modules/omm/spec/**/*.js*",
			"testweb/node_modules/omm/spec/**/*.d.ts",
			"testweb/client/*.js",
			"testweb/client/*.js.map",
			"testweb/server/*.js",
			"testweb/server/*.js.map"
		] },
		ts: {
			omm : {
				tsconfig:"testweb/node_modules/omm/tsconfig.json"
			},
			build : {
				tsconfig:"testweb/node_modules/omm/tsconfig.json",
				options:{
					declaration:true
				},
				outDir:"testweb/node_modules/omm/build"
			},
			other : {
				tsconfig:true
			}
		}
	});

	grunt.registerTask('default', ["clean", "compile"]);
	grunt.registerTask('compile', ["ts:omm", "ts:other", "ts:build"]);

	// NPM TASKS
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-nodemon");
	grunt.loadNpmTasks("grunt-concurrent");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');

};