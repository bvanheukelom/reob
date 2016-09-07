module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	grunt.initConfig({
		watch: {
			files: ["src/**/*.ts"],
			tasks: ["compile"]
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
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');

};