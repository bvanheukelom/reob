module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	var annotationFiles = [
		"meteor/packages/mapper/Persistable.ts",
		"meteor/packages/mapper/ObjectRetriever.ts",
		"meteor/packages/mapper/TypeClass.ts",
		"meteor/packages/mapper/PersistencePath.ts",
		"meteor/packages/mapper/PersistenceAnnotation.ts",
		"commonjs/main.ts"
	];
	grunt.initConfig({
		watch: {
			files: ["**/*.ts"],
			tasks: ["ts","copyCode"]
		},
		ts: {
			default : {
				src: ["meteor/**/*.ts", "!node_modules/**/*.ts"],
				options:{
					compiler:"/usr/local/bin/tsc"
				}
			},
			commonjs : {
				src: annotationFiles,
				options:{
					compiler:"/usr/local/bin/tsc",
					declaration:"build/commonjs/mapper.d.ts",
					module:"commonjs"
				},
				out:"build/commonjs/mapper.js"
			},
			amd : {
				src: annotationFiles,
				options:{
					compiler:"/usr/local/bin/tsc",
					module:"amd"
				},
				out:"build/amd/mapper.js"
			}

		}
	});

	grunt.registerTask('default', ["meteor", "copyCode"]);
	grunt.registerTask('meteor', ["ts","copyCode", "copyMeteorPackageToBuild"]);
	grunt.registerTask('commonjs', ['ts:commonjs', 'copyCommonJsFiles']);
	grunt.registerTask('amd', ['ts:amd', 'copyAmdFiles']);

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
	grunt.registerTask("copyCommonJsFiles", "Copies all necessary files for the common js package", function () {
		grunt.file.copy("commonjs/package.json", "build/commonjs/package.json");
	});

	grunt.registerTask("copyAmdFiles", "Copies all necessary files for the amd js package", function () {
		//grunt.file.copy("commonjs/package.json", "build/amd/package.json");
	});
	grunt.registerTask("copyMeteorPackageToBuild", "Copies all necessary files for the amd js package", function () {
		grunt.util.recurse(grunt.file.expand("meteor/packages/mapper/*"), function(file){
			var fileName = file.split('/').pop();
			console.log(file + " --> " , "build/meteor/"+fileName );
			grunt.file.copy(file, "build/meteor/"+fileName);
		});
	});

};