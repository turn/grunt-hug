var path = require('path');

var requireFinder = /(?:require\([\'||\""])(.*)[\'||\""]\)/gi;

// Topological sorter based on Kahn's (1962) algorithm -- via Wikipedia
var solveDependencies = function(dependencyListMap, dependerListMap){
	var independents = [];
	var resolved = [];
	var node;
	
	for(node in dependencyListMap){
		if(dependencyListMap.hasOwnProperty(node)){
			if(dependencyListMap[node].length === 0){
				independents.push(node);
			}
		}
	};
	
	var nodeDependencies, dependency;

	while(node = independents.pop()){
		resolved.push(node);

		nodeDependencies = dependerListMap[node];
		while(dependency = nodeDependencies.pop()){
			dependencyListMap[dependency].splice(dependencyListMap[dependency].indexOf(node),1);
			
			if(dependencyListMap[dependency].length === 0){
				independents.push(dependency);
			}
		}
	}
	
	return resolved;
};

var gruntHug = module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions.', function(){
		var srcDir = this.data.src,
			destPath = this.file.dest,
			separator = this.data.separator || grunt.utils.linefeed,
			dependerListMap = {},
			dependencyListMap = {};
			moduleIdMap = {},
			moduleIdCounter = 0,
			sources = {},
			destSource = [];
		
		function resolveDependencies(baseDir, filename, src){
			var requireMatch, 
				requirePath, 
				dependencyList = [],
				moduleId,
				filePath =path.resolve(path.join(baseDir,filename)),
				replaceQueue = [];

			if(!dependerListMap[filePath]) dependerListMap[filePath] = [];
			if(!moduleIdMap[filePath]) moduleIdMap[filePath] = moduleIdCounter++;		
			
			src = "(function(){\nvar exports = {};\n" + src + "\n__module" + moduleIdMap[filePath] + " = exports;\n}());";

			while(requireMatch = requireFinder.exec(src)){
				requirePath = requireMatch[1];
				if(!requirePath) continue;

				requiredPath = path.resolve(path.join(baseDir, requirePath));
				moduleId = moduleIdMap[requiredPath] || (moduleIdMap[requiredPath] = moduleIdCounter++);		
				dependerList = dependerListMap[requiredPath] || (dependerListMap[requiredPath] = []);
				dependerList.push(filePath);
				dependencyList.push(requiredPath);
				replaceQueue.push({
					match: requireMatch[0],
					replacement: '__module' + moduleId
				});
			};

			replaceQueue.forEach(function(replaceObj){
				src = src.replace(replaceObj.match, replaceObj.replacement);
			});

			dependencyListMap[filePath] = dependencyList;
			sources[filePath] = src;

			return src;
		};
		
		grunt.file.recurse(srcDir, function(filepath, rootdir, subdir, filename){
			var baseDir = path.join(rootdir, subdir),
				src = grunt.task.directive(filepath, grunt.file.read);
			resolveDependencies(baseDir, filename, src);
		});

		var resolved = solveDependencies(dependencyListMap, dependerListMap);
		console.log(resolved);
		var header = "(function(){\n";
		var footer = "\n}());";
		var moduleVars = [];
		for(filePath in moduleIdMap){
			if(moduleIdMap.hasOwnProperty(filePath)){
				moduleVars.push("__module" + moduleIdMap[filePath]);
			}
		}

		if(moduleVars.length > 0){
			header += "var " + moduleVars.join(', ') + ";\n";
		}

		destSource.push(header);

		resolved.forEach(function(filePath){
			destSource.push(sources[filePath]);
		});

		destSource.push(footer);

		destSource = destSource.join(grunt.utils.normalizelf(separator));

		grunt.file.write(destPath, destSource);

	    if (this.errorCount) { return false; }

	    grunt.log.writeln('File "' + destPath + '" created.');
	});
};