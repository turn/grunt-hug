var DependencyManager = require('./DependencyManager.js'),
	readModule = require('./readModule.js');

function createExportsObject(dependencyManager, exportMap){
	var name, 
		path,
		exportsList = [];

	for(name in exportMap){
		if(exporMap.hasOwnProperty(name)){
			path = exportMap[name];
			exportsList.push('"' + name.replace('"','\\"') + '":' + dependencyManager.getId(path));
		}
	}

	return "{" + exportsList.join(',') + "}";
}

function buildPackage(dependencyManager, srcMap, exportMap){
	var srcList = [],
		orderedPathList = dependencyManager.getList(),
		packageSrc;

	orderedPathList.forEach(function(path){
		srcList.push(srcMap[path]);
	});
	
	packageSrc = "(function(){\n";
	packageSrc += srcList.join('\n') + '\n';
	if(exportMap) packageSrc += "return " + createExportsObject(dependencyManager, exportMap) + ";";
	packageSrc += "}());";

	return packageSrc;
}

function hug(pathList, exportMap, callback){
	var dependencyManager = new DependencyManager(),
		srcMap = {},
		returnCounter = 0;

	pathList.forEach(function(path){
		dependencyManager.register(path);

		readModule(path, dependencyManager, function(src){
			srcMap[path] = src;
			returnCounter++;
			if(returnCounter === pathList.length){
				callback(buildPackage(dependencyManager, srcMap, exportMap));
			}
		});
	});
}

module.exports = hug;