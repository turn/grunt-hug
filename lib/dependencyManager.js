var utils = require('./utils.js');

var create = module.exports = function(options){
	options = options || {};

	var manager = new DependencyManager();

	if(options.log) manager.log = options.log;
	if(options.debug) manager.debug = options.debug;

	return manager;
};

function DependencyManager(){
	this.dependentMap = {};
	this.dependencyMap = {};
	this.moduleIdMap = {};
	this.moduleIdCounter = 0;
}

DependencyManager.prototype.log = utils.noop;
DependencyManager.prototype.debug = utils.noop;

DependencyManager.prototype.add = function(dependentPath, dependencyPath){
	this.debug('[Dependency Manager] Adding dependency ' + dependentPath + " -> " + dependencyPath);

	var dependentList = this.dependentMap[dependencyPath] || (this.dependentMap[dependencyPath] = []);
	dependentList.push(dependentPath);

	var dependencyList = this.dependencyMap[dependentPath] || (this.dependencyMap[dependentPath] = []);
	dependencyList.push(dependencyPath);
};

DependencyManager.prototype.getId = function(path){
	var moduleId = this.moduleIdMap[path];
	if(moduleId === void 0){
		moduleId = this.generateId(path);
	}
	
	return moduleId;
};

DependencyManager.prototype.idPrefix = "__m";
DependencyManager.prototype.generateId = function(path){
	var moduleId = this.moduleIdMap[path] = this.idPrefix + this.moduleIdCounter++;
	
	this.debug('[Dependency Manager] ' + path + " assigned id " + moduleId);
	
	if(!this.dependencyMap[path]) this.dependencyMap[path] = [];
	return moduleId;
};

DependencyManager.prototype.register = function(path){
	return this.getId(path);
};

// Uses Kahn's toposort
DependencyManager.prototype.getList = function(){
	var dependencyMap = this.dependencyMap,
		dependentMap = this.dependentMap,
		independents = [],
		resolved = [],
		node,
		nodeDependencies,
		dependencyList,
		dependencyPath,
		unresolved = [];

	for(node in dependencyMap){
		if(dependencyMap.hasOwnProperty(node)){
			if(dependencyMap[node].length === 0){
				independents.push(node);
			}
		}
	}

	while(node = independents.pop()){
		resolved.push(node);
		nodeDependencies = dependentMap[node];
		
		if(!nodeDependencies){
			continue;
		}

		while(dependencyPath = nodeDependencies.pop()){
			dependencyList = dependencyMap[dependencyPath];
			dependencyList.splice(dependencyList.indexOf(node),1);
			if(dependencyList.length === 0){
				independents.push(dependencyPath);
			}
		}
	}

	for(node in dependencyMap){
		if(dependencyMap.hasOwnProperty(node)){
			if(dependencyMap[node].length !== 0){
				unresolved.push(node);
			}
		}
	}

	if(unresolved.length > 0){
		throw new Error('Unable to resolve dependency map, you may have circular dependencies or typos in required filenames in the following files: \n\t' + unresolved.join('\n\t') + "\n");
	}

	return resolved;
};