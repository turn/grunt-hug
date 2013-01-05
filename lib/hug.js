var path = require('path'),
	DependencyManager = require('./DependencyManager.js'),
	readModule = require('./readModule.js');

function buildPackage(dependencyManager, srcMap, exports, exportsVariable){
	var srcList = [],
		orderedPathList = dependencyManager.getList(),
		packageSrc;

	orderedPathList.forEach(function(path){
		srcList.push(srcMap[path]);
	});
	
	packageSrc = "";
	if(exports) packageSrc += ";" + exportsVariable + "=";
	packageSrc += "(function(){\n";
	packageSrc += srcList.join('\n') + '\n';
	if(exports) packageSrc += "return " + dependencyManager.getId(exports) + ";";
	packageSrc += "}());";

	return packageSrc;
}

var hug = module.exports = function(options){
	options = options || {};

	var srcList = options.srcList,
		exports = options.exports,
		exportsVariable = options.exportsVariable || "exports",
		successCallback = options.success,
		errorCallback = options.error,
		pathList = [],
		dependencyManager = new DependencyManager(),
		srcMap = {},
		returnCounter = 0;

	srcList.forEach(function(src){
		pathList.push(path.resolve(src));
	});

	if(exports) exports = path.resolve(exports);

	try{
		pathList.forEach(function(path){
			dependencyManager.register(path);

			readModule(path, dependencyManager, function(src){
				srcMap[path] = src;
				returnCounter++;

				if(returnCounter === pathList.length){
					try{
						successCallback(buildPackage(dependencyManager, srcMap, exports, exportsVariable));
					} catch(e){
						errorCallback(e.message);
					}
				}
			});
		});
	} catch(e){
		errorCallback("Unable to read source files.");
	}
};