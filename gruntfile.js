module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	grunt.initConfig({
		watch: {
			files: ["**/*.ts"],
			tasks: ["ts","copyCode"]
		},
		ts: {
			meteor : {
				src: ["src/**/*.ts", "!src/annotations/**/*.ts"],
				options:{
					compiler:"/usr/local/bin/tsc",
					sourceMap:false,
					declaration:"build/meteor/omm/omm.d.ts"
				},
				outDir:"build/meteor/omm"
			},
			commonjs : {
				src:  ["src/annotations/**/*.ts","src/annotations.d.ts"],
				options:{
					compiler:"/usr/local/bin/tsc",
					sourceMap:false,
					declaration:"build/commonjs/omm.d.ts",
					module:"commonjs"
				},
				out:"build/commonjs/omm/omm.js"
			},
			amd : {
				src:  ["src/annotations/**/*.ts"],
				options:{
					compiler:"/usr/local/bin/tsc",
					sourceMap:false,
					declaration:"build/amd/omm.d.ts",
					module:"amd"
				},
				out:"build/amd/omm/omm.js"
			},
			test : {
				src: ["test_meteor_web/**/*.ts", "!node_modules/**/*.ts"],
				options:{
					compiler:"/usr/local/bin/tsc"
				}
			}

		}
	});

	grunt.registerTask('default', ["meteor", "commonjs", "amd", "testweb"]);
	grunt.registerTask('meteor', ["ts:meteor",  "copyMeteorPackageResources"]);
	grunt.registerTask('commonjs', ['ts:commonjs', 'copyCommonJsFiles']);
	grunt.registerTask('amd', ['ts:amd', 'copyAmdFiles']);
	grunt.registerTask('testweb', ["meteor", 'ts:test', 'copyFilesToTestMeteorWeb']);

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
			if( returnContent.length>0 )
				returnContent+="\n";
			if (splitArray[i].indexOf("var ") != 0 )
			{
				returnContent += splitArray[i];
			}else
			{
				returnContent += splitArray[i].substr(4);
				console.log(splitArray[i]);
			}

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
			if( file.indexOf("package.js")!=0)
			{
				console.log("Rewriting " + file);
				grunt.file.copy(file, file, {
					process: processFunction
				});
			}
		});
	};

	// CUSTOM TASKS
	grunt.registerTask("copyFilesToTestMeteorWeb", "Copies all necessary files", function () {
		cp("test_meteor_web/tests/jasmine/Tests.js", "test_meteor_web/tests/jasmine/client/integration/sample/src/Tests.js");
		cp("test_meteor_web/tests/jasmine/Tests.js", "test_meteor_web/tests/jasmine/server/integration/sample/src/Tests.js");
		grunt.util.recurse(grunt.file.expand("build/meteor/mapper/*"), function(file){
			var fileName = file.split('/').pop();
			console.log(file + " --> " , "build/meteor/mapper/"+fileName );
			grunt.file.copy(file, "test_meteor_web/packages/mapper/"+fileName);
		});
		rewrite("test_meteor_web/packages/testclasses/*.js");
		rewrite("test_meteor_web/tests/**/*.js");
	});
	grunt.registerTask("clean", "cleans files", function () {
		grunt.file.delete("code/.baseDir.ts");
		grunt.file.delete("build");
		grunt.file.delete("test_meteor_web/packages/mapper");
		grunt.util.recurse(grunt.file.expand("code/*.js"), function(file) {
			grunt.file.delete(file);
		});
		grunt.util.recurse(grunt.file.expand("test_meteor_web/**/*.js"), function(file) {
			if( file.indexOf("package.js")==-1)
				grunt.file.delete(file);
		});
		grunt.util.recurse(grunt.file.expand("code/*.map"), function(file) {
			grunt.file.delete(file);
		});
	});

	grunt.registerTask("copyCommonJsFiles", "Copies all necessary files for the common js package", function () {
		grunt.file.copy("resources/commonjs/package.json", "build/commonjs/omm/package.json");
		grunt.file.copy("build/commonjs/omm/omm.js", "build/commonjs/omm/omm.js", {process:function(content){
			return content+grunt.file.read("resources/commonjs/append.js");
		}});
	});

	grunt.registerTask("copyAmdFiles", "Copies all necessary files for the amd js package", function () {
		//grunt.file.copy("commonjs/package.json", "build/amd/package.json");
	});
	grunt.registerTask("copyMeteorPackageResources", "Copies all necessary files for the amd js package", function () {
		grunt.util.recurse(grunt.file.expand("resources/meteor/*"), function(file){
			var fileName = file.split('/').pop();
			console.log(file + " --> " , "build/meteor/omm/"+fileName );
			grunt.file.copy(file, "build/meteor/omm/"+fileName);
		});
		rewrite("build/meteor/omm/*.js");
	});

};