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
	var processFunction = function (content) {
		var returnContent = "";
		var splitArray = content.split("\n");
		for (var i = 0; i < splitArray.length; i++) {
			if (splitArray[i].indexOf("var ") != 0 )
			{
				returnContent += splitArray[i]+"\n";
			}else
				returnContent += splitArray[i].substr(4)+"\n";

		}
		return returnContent;
	};

	var cp = function (src, dest) {
		grunt.util.recurse(grunt.file.expand(src), function(file){

			console.log(file + " --> " + dest);
			grunt.file.copy(file, dest, {
				process: processFunction
			});
		});
	};

	var rewrite = function (dir) {

		grunt.util.recurse(grunt.file.expand(dir), function(file){
			if( file.indexOf("Reflect.js")==-1 )
			{
				console.log(file + " --> " + file);
				grunt.file.copy(file, file, {
					process: processFunction
				});
			}
		});
	};

	// CUSTOM TASKS
	grunt.registerTask("copyCode", "Copies all necessary files", function () {
		cp("meteor/tests/jasmine/Tests.js", "meteor/tests/jasmine/client/integration/sample/src/Tests.js");
		cp("meteor/tests/jasmine/Tests.js", "meteor/tests/jasmine/server/integration/sample/src/Tests.js");
		rewrite("meteor/packages/mapper/*.js");
		rewrite("meteor/packages/testclasses/*.js");
		rewrite("meteor/js/*.js");
	});

};