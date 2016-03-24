module.exports = function (grunt) {

	// GRUNT CONFIGURATION

	grunt.initConfig({
		watch: {
			files: ["test_meteor_web/**/*.ts"],
			tasks: ["default"]
		},
		ts: {

			commonjs : {
				src:  ["testweb/node_modules/omm/src/**/*.ts"],
				options:{
					sourceMap:false,
					declaration:"testweb/node_modules/omm/build/omm.d.ts",
					module:"commonjs",
					experimentalDecorators:true
				},
				out:"testweb/node_modules/omm/build/omm.js"
			},
			test : {
				src: ["testweb/node_modules/omm_testclasses/src/**/*.ts"],
				options:{
					removeComments:false,
					declaration:"testweb/node_modules/omm/build/omm_testclasses.d.ts",
					experimentalDecorators:true,
					module:"commonjs"
				},
				out:"testweb/node_modules/omm_testclasses/build/omm_testclasses.js"
			}


		}
	});

	grunt.registerTask('default', ["testweb", "commonjs", "buildDeclaration", "ts:nonMeteorPlain"]);
	grunt.registerTask('testweb', ["ts:meteor", 'ts:test', "rewrite", 'copyFilesToTestMeteorWeb']);
	grunt.registerTask('commonjs', ["ts:commonjs", 'copyCommonJsFiles']);
	grunt.registerTask('buildDeclaration', ["ts:buildDeclaration", 'copyDeclarationFiles']);

	// NPM TASKS
	grunt.loadNpmTasks("grunt-ts");
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
	function appendStringRequireModuleNameAndRemoveReferences( filename, moduleName ){
		grunt.file.copy( filename,filename, {process:function(content){
			var returnContent = "";
			var splitArray = content.split("\n");
			for (var i = 0; i < splitArray.length; i++) {
				if (splitArray[i].indexOf("///") != 0 )
				{
					returnContent += splitArray[i]+"\n";
				}
			}
			returnContent+="declare module '"+moduleName+"' {\n";
			returnContent+="\texport="+moduleName+";\n";
			returnContent+="}\n";

			return returnContent;
		}
		});
	}
	// CUSTOM TASKS
	grunt.registerTask("copyFilesToTestMeteorWeb", "Copies all necessary files", function () {
		cp("test_meteor_web/tests/jasmine/Tests.js", "test_meteor_web/tests/jasmine/client/integration/sample/src/Tests.js");
		cp("test_meteor_web/tests/jasmine/Tests.js", "test_meteor_web/tests/jasmine/server/integration/sample/src/Tests.js");
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
		grunt.file.copy("build/commonjs/omm.js", "build/commonjs/omm.js", {process:function(content){
			return content+"\nmodule.exports = omm;\n";
		}});
	});

	grunt.registerTask("copyDeclarationFiles", "Copies all necessary files for the common js package", function () {
		grunt.file.delete("build/declaration/omm.js")
		appendStringRequireModuleNameAndRemoveReferences("build/declaration/omm.d.ts", "omm");
	});

	grunt.registerTask("copyAmdFiles", "Copies all necessary files for the amd js package", function () {
		//grunt.file.copy("commonjs/package.json", "build/amd/package.json");
	});
	grunt.registerTask("rewrite", "Copies all necessary files for the amd js package", function () {
		//rewrite("testweb/node_modules/omm/test/**/*.js");
		rewrite("testweb/packages/**/*.js");
	});
	grunt.registerTask("rewriteDTS", "Copies all necessary files for the amd js package", function () {
		function rewriteDTS(name)
		{
			grunt.file.copy(name, name, {
				process: function (content)
				{
					var s = content;
					var l, p;
					do {
						l = s.length;
						s = s.replace('declare module omm', 'export module omm');
						p = s.length;
					} while (l != p);
					var splitArray = s.split("\n");
					var returnContent = "";
					for (var i = 0; i < splitArray.length; i++)
					{
						if (splitArray[i].indexOf("///") != 0)
						{
							returnContent += splitArray[i] + "\n";
						}
					}
					return returnContent;
				}
			});
		}
		rewriteDTS('testweb/node_modules/omm/build/omm.d.ts');
		rewriteDTS('testweb/node_modules/omm_testclasses/build/omm_testclasses.d.ts');
	});
};