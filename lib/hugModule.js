var path = require('path'),
	fs = require('fs');

var utils = require('./utils.js');

// File path should already be resolved when passed here
var hugModule = module.exports = function(filePath, config, callback){
	var dependencyManager = config.dependencyManager,
		resolver = config.resolver;
	
	fs.readFile(filePath, function(err, src){
		var moduleId;

		if(err instanceof Error){
			callback(filePath, err);
			return;
		}

		moduleId = dependencyManager.register(filePath);
		
		processModule(filePath, src.toString(), config, function(src){
			if(src instanceof Error){
				callback(src);
			} else {
				callback(filePath, "var " + moduleId + " = " + config.moduleHeader + src + config.moduleFooter);	
			}
		});
	});
};

function processModule(srcPath, src, config, callback){
	var resolver = config.resolver,
		dependencyManager = config.dependencyManager,
		dependencyFinder = config.dependencyFinder,
		dependencyMatch,
		dependencyPath,
		dependencyLocations = [],
		dependencyPaths = [],
		resolvedDependencies = [],
		replaceQueue = [],
		hasError = false,
		waitingCounter = 0;

	while(dependencyMatch = dependencyFinder.exec(src)){
		dependencyPath = stripslashes(dependencyMatch[1]);
		
		if(!dependencyPath) continue;
		
		dependencyLocations.push([dependencyPath, dependencyMatch[0]]);
	}

	utils.each(dependencyLocations, function(item){
		var location = item[1],
			filePath = item[0];

		waitingCounter++;

		resolver.resolve(filePath, function(resolvedPath){
			if(hasError) return;

			if(resolvedPath instanceof Error){
				callback(resolvedPath);
				hasError = true;
				return;
			}

			if(!~resolvedDependencies.indexOf(resolvedPath)){
				resolvedDependencies.push(resolvedPath);

				if(!~config.srcList.indexOf(resolvedPath)){
					config.debug('[Module Hugger] Found additional dependency: ' + resolvedPath);
					config.srcList.push(resolvedPath);
				}
			}

			dependencyManager.add(srcPath, resolvedPath);
		
			replaceQueue.push([
				location,
				dependencyManager.getId(resolvedPath)
			]);	

			waitingCounter--;

			// If we've resolved everything, we're done
			if(waitingCounter === 0){
				replaceQueue.forEach(function(replaceObj){
					src = src.replace(replaceObj[0], replaceObj[1]);
				});

				callback(src);
			}
		}, {
			path: [path.dirname(srcPath)]
		});
	});

	if(waitingCounter === 0){
		process.nextTick(function(){callback(src);});
	} 
}

// http://phpjs.org/functions/stripslashes/
function stripslashes (str) {
	return (str + '').replace(/\\(.?)/g, function (s, n1) {
		switch (n1) {
		case '\\':
			return '\\';
		case '0':
			return '\u0000';
		case '':
			return '';
		default:
			return n1;
		}
	});
}
