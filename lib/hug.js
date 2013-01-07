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
		srcPath,
		index = 0,
		processingDone = false;
		returnCounter = 0;

	srcList.forEach(function(src){
		pathList.push(path.resolve(src));
	});

	try{
		function contentCallback(srcPath, src){
			srcMap[srcPath] = src;
			returnCounter++;
			
			if(processingDone && pathList.length > index) processPathList();

			if(returnCounter === pathList.length){
				try{
					successCallback(buildPackage(dependencyManager, srcMap, options));
				} catch(e){
					errorCallback(e.message);
				}
			}
		}
		
		// We run through the process list until the end. During the processing
		// files may add more files to be processed. If more files are added,
		// the processing will continue (triggered in contentCallback).
		function processPathList(){
			while(srcPath = pathList[index]){
				dependencyManager.register(srcPath);

				readModule(srcPath, pathList, dependencyManager, contentCallback, options);
				index++;
			}

			processingDone = true;
		}

		processPathList();
	} catch(e){
		errorCallback("Unable to read source files.");
	}
};