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
};

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var srcDir = this.data.src,
			destPath = this.file.dest;
		
		var hug = new Hug(grunt, {
			separator: this.data.separator || grunt.utils.linefeed,
			exportsVariable: this.data.exportsVariable
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
		dependencyPath;

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
			dependencyListMap[dependencyPath].splice(dependencyListMap[dependencyPath].indexOf(node),1);
			
			if(dependencyListMap[dependencyPath].length === 0){
				independents.push(dependencyPath);
			}
		}
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

	this._grunt.file.recurse(dir, function(filepath, rootdir, subdir, filename){
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
	var sourceList = [];

	var header = "";
	if(this._exportsVariable){
		header += this._exportsVariable + " = ";
	}

	header += "(function(){\n";
	header += "var module = {};\n";
	header += "var exports = {};\n";
	header += "var __export = function(objectPath, data){\n";
	header += "		var curObj = exports, objName, index = 0, length = objectPath.length - 1;\n";
	header += "		for(;index < length; index++){\n";
	header += "			objName = objectPath[index];\n";
	header += "			curObj = curObj[objName] || (curObj[objName] = {});\n";
	header += "		}\n";
	header += "		curObj[objectPath[index]] = data;\n";
	header += "};\n";
	header += "var __import = function(objectPath){\n";
	header += "		var curObj = exports, objName, index = 0, length = objectPath.length;\n";
	header += "		for(;index < length; index++){\n";
	header += "			objName = objectPath[index];\n";
	header += "			curObj = curObj[objName];\n";
	header += "			if(curObj === void 0) return;\n";
	header += "		}\n";
	header += "		return curObj;\n";
	header += "};\n";

	var footer = "\nreturn module.exports || exports;\n";
	footer += "}());\n";
	sourceList.push(header);

	sources.forEach(function(source){
		sourceList.push(source);
	});

	sourceList.push(footer);

	return sourceList.join(this._grunt.utils.normalizelf(this._grunt.utils.linefeed));
};

Hug.prototype._parseFile = function(filepath, rootdir, subdir, filename){
	var contents,
		src,
		dependencyMatch, 
		dependencyPath,
		dependencyFinder = this.DEPENDENCY_FINDER,
		objPath = getObjectPath(subdir, filename),
		replaceQueue = [];
	
	src = this._grunt.task.directive(filepath, this._grunt.file.read);
	
	contents = "(function(){\n";
	contents += "var module = {};\n";
	contents += "var exports = {};\n";
	contents += src;
	contents += "\n__export(" + JSON.stringify(objPath) + ", module.exports || exports);\n}());";

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
		var objectPath = getObjectPath(path.dirname(path.relative(rootdir, replaceObj.path)), replaceObj.path);
		var importStatement = "__import(" + JSON.stringify(objectPath) + ")";
		contents = contents.replace(replaceObj.match, importStatement);
	});

	return contents;
};

Hug.prototype._setDependency = function(dependentPath, dependencyPath){
	var dependentList = this._dependentListMap[dependencyPath] || (this._dependentListMap[dependencyPath] = []);
	dependentList.push(dependentPath);

	var dependencyList = this._dependencyListMap[dependentPath] || (this._dependencyListMap[dependentPath] = []);
	dependencyList.push(dependencyPath);
};
