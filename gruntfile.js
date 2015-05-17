module.exports = function (grunt) {

	// GRUNT CONFIGURATION
	grunt.initConfig({
		watch: {
			files: ["*.ts"],
			tasks: ["compile","copyCode"]
		},
		typescript: {
			options: {
				module: "commonjs",
				target: "es5",
				sourceMap: true,
				declaration: false,
				removeComments: false
			},
			compile: {
				src: ["*.ts"]
			}
		},
		ts: {
			default : {
				src: ["**/*.ts", "!node_modules/**/*.ts"],
				options:{
					module:"commonjs",
					compiler:"/usr/local/bin/tsc"
				}
			}

		},
		jasmine_node: {
			testing: {
				options: {
					coverage: {
						reportDir : "./build/coverage",
						report : ['lcov', 'cobertura']
					},
					forceExit: true,
					match: '.',
					matchAll: true,
					specFolders: ['shared/tests', 'rts/tests'],
					extensions: 'js',
					specNameMatcher: '*',
					captureExceptions: true,
					junitreport: {
						report: true,
						savePath : './build/reports/jasmine/',
						useDotNotation: true,
						consolidate: true
					}
      			},
      			src: ['**/*.js']
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

	// TASK MAPPING
	//grunt.registerTask("watch", ["typescript:compile", "watch"]);
	grunt.registerTask("compile", ["ts", "copyCode"]);
	grunt.registerTask("test", ["jasmine_node"]);

	// CUSTOM TASKS
	grunt.registerTask("copyCode", "Copies all necessary files to RTS and Meteor", function () {

		// copy all js files to meteor, opening them, removing the references
		var processFunction = function (content) {
			var returnContent = "";
			var splitArray = content.split("\n");
			for (var i = 0; i < splitArray.length; i++) {
				if (splitArray[i].indexOf("require(") == -1 && splitArray[i].indexOf("//# sourceMappingURL") == -1 && splitArray[i].indexOf("module.exports") == -1&& splitArray[i].indexOf("exports.") == -1 /* && splitArray[i].indexOf("__metadata('design:")==-1*/ )
				{
					// take care of local var's
					if (splitArray[i].indexOf("var ") == 0) {
						returnContent += splitArray[i].substr(4);
					} else
						returnContent += splitArray[i];
					returnContent += "\n";
				}
			}
			return returnContent;
		};

		var sharedCodeDirectory = "meteor/js/";
		var loadingIndicator = 1;
		var getNextLoadingNumber = function () {
			return ("00" + loadingIndicator++).slice(-3);
		};

		var cp = function (src, destDir) {
			if (!destDir)
				destDir = sharedCodeDirectory;
		    grunt.util.recurse(grunt.file.expand(src), function(file){
			    var dest = destDir + getNextLoadingNumber() + "_" + file.substr((file.lastIndexOf('/') + 1));
			    console.log(file + " --> " + dest);
				grunt.file.copy(file, dest, {
					process: processFunction
				});
		    });
		};
		grunt.file.delete(sharedCodeDirectory);
		grunt.file.delete("meteor/tests/jasmine/client/integration/sample/src/");
		grunt.file.delete("meteor/tests/jasmine/server/integration/sample/src/");
		grunt.file.copy("node_modules/reflect-metadata/Reflect.js", sharedCodeDirectory+"000_Reflect.js");
		cp("Tests.js", "meteor/tests/jasmine/client/integration/sample/src/");
		cp("Tests.js", "meteor/tests/jasmine/server/integration/sample/src/");
		cp("ClientTests.js", "meteor/tests/jasmine/client/integration/sample/src/");
		cp("ServerTests.js", "meteor/tests/jasmine/server/integration/sample/src/");
		cp("module.js");
		cp("Persistable.js");
		cp("MeteorObjectRetriever.js");
		cp("ConstantObjectRetriever.js");
		cp("Document.js");
		cp("PersistencePath.js");
		cp("PersistenceAnnotation.js");
		cp("Serializer.js");
		cp("MeteorPersistence.js");
		cp("BaseCollection.js");

		cp("TestLeaf.js");
		cp("TestTree.js");
		cp("TestAddress.js");
		cp("TestPhoneNumber.js");
		cp("TestPerson.js");
		cp("TestPersonCollection.js");
		cp("TestTreeCollection.js");
	});

};