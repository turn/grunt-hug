var path = require('path');

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

function getObjectPath(basedir, filename){
	var objPath = [];

	if(basedir){
		basedir.split(path.sep).forEach(function(objName){
			if(objName === "."){
				return;	
			}

			objPath.push(objName);
		});
	}
	
	objPath.push(path.basename(filename, path.extname(filename)));

	return objPath;
}

var Hug = function(grunt, options){
	options = options || {};

	this._grunt = grunt;
	this._seperator = options.separator || grunt.utils.linefeed;
	this._exportsVariable = options.exportsVariable;
	this._header = options.header;
};

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var srcDir = this.data.src,
			destPath = this.file.dest;
		
		var hug = new Hug(grunt, {
			separator: this.data.separator || grunt.utils.linefeed,
			exportsVariable: this.data.exportsVariable,
			header: this.data.header
		});
		var destSource = hug.parse(srcDir);
		
		grunt.file.write(destPath, destSource);
		if (this.errorCount) { return false; }

		grunt.log.writeln('File "' + destPath + '" created.');
	});
};

// Kahn's toposort
Hug.prototype._solveDependencies = function(){
	var dependencyListMap = this._dependencyListMap,
		dependentListMap = this._dependentListMap,
		independents = [],
		resolved = [],
		node,
		nodeDependencies,
		dependencyList,
		dependencyPath,
		unresolved = [];

	for(node in dependencyListMap){
		if(dependencyListMap.hasOwnProperty(node)){
			if(dependencyListMap[node].length === 0){
				independents.push(node);
			}
		}
	}

	while(node = independents.pop()){
		resolved.push(node);
		nodeDependencies = dependentListMap[node];
		if(!nodeDependencies){
			continue;
		}

		while(dependencyPath = nodeDependencies.pop()){
			dependencyList = dependencyListMap[dependencyPath];
			dependencyList.splice(dependencyList.indexOf(node),1);
			if(dependencyList.length === 0){
				independents.push(dependencyPath);
			}
		}
	}

	for(node in dependencyListMap){
		if(dependencyListMap.hasOwnProperty(node)){
			if(dependencyListMap[node].length !== 0){
				unresolved.push(node);
			}
		}
	}

	if(unresolved.length > 0){
		this._grunt.fail.warn('Unable to resolve dependency map, you may have circular dependencies or typos in required filenames in the following files: \n\t' + unresolved.join('\n\t') + "\n");
	}

	return resolved;
};

Hug.prototype.DEPENDENCY_FINDER = /require\([\'||\"](.*)[\'||\"]\)/gi; //'

Hug.prototype.parse = function(dir){
	var self = this,
		resolvedDependencies,
		sourceMap = {},
		sourceList = [];

	this._dependentListMap = {};
	this._dependencyListMap = {};
	this._moduleIdCounter = 0;
	this._moduleIds = {};
	this._moduleMap = {};

	this._grunt.file.recurse(dir, function(filepath, rootdir, subdir, filename){
		if(path.extname(filepath) !== '.js' || (self._header && self._header.indexOf(filepath) !== -1)){
			return;	
		}
		
		filepath = path.resolve(filepath);
		sourceMap[filepath] = self._parseFile(filepath, rootdir, subdir, filename);
	});

	resolvedDependencies = this._solveDependencies();
	
	resolvedDependencies.forEach(function(filepath){
		sourceList.push(sourceMap[filepath]);
	});

	return this._prepare(sourceList);
};

Hug.prototype._prepare = function(sources){
	var self = this,
		sourceList = [],
		headerFilepath;

	var header = "";
	if(this._exportsVariable){
		header += this._exportsVariable + " = ";
	}

	header += "(function(){\n";
	
	if(this._header){
		this._grunt.file.expand(this._header).forEach(function(filepath){
			filepath = path.resolve(filepath);
			header += self._grunt.task.directive(filepath, self._grunt.file.read) + "\n";
		});
	}

	var footer = "\n";
	footer += "return " + JSON.stringify(this._moduleMap).replace(/("::)|(::")/g, '') + ";\n";
	footer += "}());\n";

	sourceList.push(header);

	sources.forEach(function(source){
		sourceList.push(source);
	});

	sourceList.push(footer);

	return sourceList.join(this._grunt.utils.normalizelf(this._grunt.utils.linefeed));
};

Hug.prototype._parseFile = function(filepath, rootdir, subdir, filename){
	var self = this,
		contents,
		src,
		moduleId = this.getModuleId(filepath),
		dependencyMatch, 
		dependencyPath,
		dependencyFinder = this.DEPENDENCY_FINDER,
		objPath = getObjectPath(subdir, filename),
		replaceQueue = [];
	
	this._registerModule(moduleId, subdir, filename);

	src = this._grunt.task.directive(filepath, this._grunt.file.read);
	
	contents = "var __module" + moduleId + " = (function(){\n";
	contents += "var module = {};\n";
	contents += "var exports = module.exports = {};\n";
	contents += src;
	contents += "\nreturn module.exports || exports;\n";
	contents += "}());";

	if(!this._dependencyListMap[filepath]){
		this._dependencyListMap[filepath] = [];
	}
	
	while(dependencyMatch = dependencyFinder.exec(contents)){
		dependencyPath = stripslashes(dependencyMatch[1]);
		
		if(!dependencyPath){
			continue;	
		} 

		dependencyPath = path.resolve(path.join(rootdir, subdir, dependencyPath));
		
		this._setDependency(filepath, dependencyPath);

		replaceQueue.push({
			match: dependencyMatch[0],
			path: dependencyPath
		});
	}
	
	replaceQueue.forEach(function(replaceObj){
		//var objectPath = getObjectPath(path.dirname(path.relative(rootdir, replaceObj.path)), replaceObj.path);
		var importStatement = "__module" + self.getModuleId(replaceObj.path);
		contents = contents.replace(replaceObj.match, importStatement);
	});

	return contents;
};

Hug.prototype.getModuleId = function(path){
	var moduleId = this._moduleIds[path];
	if(moduleId === void 0){
		moduleId = this._createModuleId(path);
	}
	
	return moduleId;
};

Hug.prototype._createModuleId = function(path){
	var moduleId = this._moduleIds[path] = this._moduleIdCounter++;
	return moduleId;
};

Hug.prototype._registerModule = function(moduleId, basedir, filename){
	var currentPackage = this._moduleMap,
		currentPackageName = "",
		moduleName = path.basename(filename, path.extname(filename)),
		objectPath = getObjectPath(basedir, filename),
		index = 0,
		length = objectPath.length - 1;
		
	for(;index < length; index++){
		currentPackageName = objectPath[index];
		currentPackage = currentPackage[currentPackageName] || (currentPackage[currentPackageName] = {});
	}

	// The colons are added for a string replace to remove JSON quoting
	currentPackage[objectPath[index]] = "::__module" + moduleId + "::";
};

Hug.prototype._setDependency = function(dependentPath, dependencyPath){
	var dependentList = this._dependentListMap[dependencyPath] || (this._dependentListMap[dependencyPath] = []);
	dependentList.push(dependentPath);

	var dependencyList = this._dependencyListMap[dependentPath] || (this._dependencyListMap[dependentPath] = []);
	dependencyList.push(dependencyPath);
};
