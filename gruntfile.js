module.exports = function (grunt) {

	// GRUNT CONFIGURATION
	grunt.initConfig({
		watch: {
			files: ["**/*.ts"],
			tasks: ["typescript:compile", "copySharedCode"]
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
				src: ["shared/**/*.ts", "rts/*.ts", "rts/shared/**/*.ts", "rts/tests/**/*.ts", "rts/web/**/*.ts", "rts/server/**/*.ts", "!rts/shared/dao/**"]
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
	grunt.loadNpmTasks("grunt-typescript");
	grunt.loadNpmTasks("grunt-nodemon");
	grunt.loadNpmTasks("grunt-concurrent");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jasmine-node-coverage');


	// TASK MAPPING
	//grunt.registerTask("watch", ["typescript:compile", "watch"]);
	grunt.registerTask("compile", ["typescript:compile", "copySharedCode"]);
	grunt.registerTask("test", ["jasmine_node"]);

	// CUSTOM TASKS
	grunt.registerTask("copyCode", "Copies all necessary files to RTS and Meteor", function () {

		// copy all js files to meteor, opening them, removing the references
		var processFunction = function (content) {
			var returnContent = "";
			var splitArray = content.split("\n");
			for (var i = 0; i < splitArray.length; i++) {
				if (splitArray[i].indexOf("require(") == -1 && splitArray[i].indexOf("//# sourceMappingURL") == -1 && splitArray[i].indexOf("module.exports") == -1) {
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

		var sharedCodeDirectory = "meteor";
		var loadingIndicator = 0;
		var getNextLoadingNumber = function () {
			return ("00" + loadingIndicator++).slice(-3);
		};

		var cp = function (src) {
		
		    grunt.util.recurse(grunt.file.expand(src), function(file){
			    var dest = sharedCodeDirectory + getNextLoadingNumber() + "_" + file.substr((file.lastIndexOf('/') + 1));
			    console.log(file + " --> " + dest);
				grunt.file.copy(file, dest, {
					process: processFunction
				});
		    });
		};
		grunt.file.delete(sharedCodeDirectory);

		cp("node_modules/reflect-metadata/Reflect.js");
		cp("Persistable.js");
		cp("Document.js");
		cp("PersistencePath.js");
		cp("PersistenceAnnotations.js");
		cp("Serializer.js");
		cp("MeteorPersistence.js");
		cp("TestClass.js");
		cp("TestCollections.js");


	});

};