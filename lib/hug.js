var path = require('path'),
	DependencyManager = require('./DependencyManager.js'),
	readModule = require('./readModule.js');

function buildPackage(dependencyManager, srcMap, options){
	options = options || {};

	var srcList = [],
		exportedVar = options.exportedVariable || "exports",
		exports = options.exports ? path.resolve(options.exports) : false,
		orderedPathList = dependencyManager.getList(),
		packageSrc;

	orderedPathList.forEach(function(path){
		srcList.push(srcMap[path]);
	});
	
	packageSrc = "";
	if(exports) packageSrc += ";" + exportedVar + "=";
	packageSrc += "function(){\n";
	packageSrc += srcList.join('\n') + '\n';
	if(exports) packageSrc += "return " + dependencyManager.getId(exports) + ";";
	packageSrc += "}();";

	return packageSrc;
}

var hug = module.exports = function(srcList, options){
	options = options || {};
	
	var pathList = [],
		successCallback = options.success || function(){},
		errorCallback = options.error || function(){},
		dependencyManager = new DependencyManager(),
		srcMap = {},
		returnCounter = 0;

	srcList.forEach(function(src){
		pathList.push(path.resolve(src));
	});

	try{
		pathList.forEach(function(path){
			dependencyManager.register(path);

			function contentCallback(src){
				srcMap[path] = src;
				returnCounter++;

				if(returnCounter === pathList.length){
					try{
						successCallback(buildPackage(dependencyManager, srcMap, options));
					} catch(e){
						errorCallback(e.message);
					}
				}
			}

			readModule(path, dependencyManager, contentCallback, options);
		});
	} catch(e){
		errorCallback("Unable to read source files.");
	}
};