module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	grunt.initConfig({
		watch: {
			files: ["test_meteor_web/**/*.ts"],
			tasks: ["default"]
		},
		clean: { files:[
			"dist",
			"src/**/*.js*",
			"src/**/*.d.ts",
			"spec/**/*.js*",
			"spec/**/*.d.ts"
		] },
		ts: {
			omm : {
				tsconfig:"tsconfig.json"
			}
		}
	});

	grunt.registerTask('default', ["clean", "compile"]);
	grunt.registerTask('compile', ["ts"]);

	// NPM TASKS
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-nodemon");
	grunt.loadNpmTasks("grunt-concurrent");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');

};