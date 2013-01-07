var path = require('path'),
	fs = require('fs'),
	DependencyManager = require('./DependencyManager.js'),
	readModule = require('./readModule.js');

function buildPackage(dependencyManager, srcMap, options){
	options = options || {};

	var srcList = [],
		exportedVar = options.exportedVariable || "exports",
		exports = options.exports ? path.resolve(options.exports) : false,
		orderedPathList = dependencyManager.getList(),
		packageSrc,
		headList = options.headList,
		headSrcs = [],
		headSrc;
	
	headList.forEach(function(filePath){
		headSrcs.push(fs.readFileSync(filePath));
	});
	headSrc = headSrcs.join('\n');

	orderedPathList.forEach(function(path){
		srcList.push(srcMap[path]);
	});
	
	packageSrc = "";
	if(exports) packageSrc += ";" + exportedVar + "=";
	packageSrc += "(function(){\n";
	if(headSrc) packageSrc += headSrc + '\n';
	packageSrc += srcList.join('\n') + '\n';
	if(exports) packageSrc += "return " + dependencyManager.getId(exports) + ";";
	packageSrc += "}());";

	return packageSrc;
}

var hug = module.exports = function(srcList, options){
	options = options || {};
	
	var pathList = [],
		headPathList = [],
		headList = options.headList || [],
		successCallback = options.success || function(){},
		errorCallback = options.error || function(){},
		dependencyManager = new DependencyManager(),
		srcMap = {},
		srcPath,
		headSrcs = [],
		headSrc,
		index = 0,
		hasError = false,
		processingDone = false,
		returnCounter = 0;

	srcList.forEach(function(src){
		pathList.push(path.resolve(src));
	});

	// Resolve head list paths and dedupe from srclist
	headList.forEach(function(filePath){
		filePath = path.resolve(filePath);
		headPathList.push(filePath);

		// Remove from path list if it was included
		var pathListIndex = pathList.indexOf(filePath);
		if(!~pathListIndex){
			pathList.splice(pathListIndex,1);
		}
	});
	options.headList = headPathList;

	try{
		function contentCallback(srcPath, src){
			if(hasError) return;
			if(typeof src !== "string"){
				hasError = true;
				errorCallback("Unable to read source files." + src.message);
				return;
			}
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
		errorCallback("Unable to read source files." + (e? " " + e.message : ""));
	}
};