var path = require('path'),
	fs = require('fs');

var utils = require('./utils.js');

var create = module.exports = function(basePaths, extensions, options){
	var resolver = new Resolver(basePaths, extensions);

	if(options.log) resolver.log = options.log;
	if(options.debug) resolver.debug = options.debug;

	resolver.debug('[Resolver] Configured to search: ' + basePaths.reverse());

	return resolver;
};

var Resolver = function(basePaths, extensions){
	this.basePaths = basePaths.reverse();
	this.extensions = extensions.reverse();
};

Resolver.prototype.log = utils.noop;
Resolver.prototype.debug = utils.noop;

Resolver.prototype.resolve = function(filePath, callback, options){
	options = options || {};
	var self = this,
		originalBasePaths = this.basePaths.concat(options.path || []),
		basePaths = originalBasePaths.slice(),
		extensions = this.extensions.concat(options.extensions || []),
		basePath = "",
		extension = "";

	this.debug('[Resolve] Asked to resolve ' + filePath + " with " + basePaths + " as path.");
	
	function tryNext(){
		var fullFilePath = path.resolve(path.join(basePath, filePath + extension));
		
		//self.debug('[Resolve] Checking if file exists: ' + fullFilePath);
		
		fs.stat(fullFilePath, function(err, stats){
			if(err || !stats.isFile()){
				basePath = basePaths.pop();
				
				if(basePaths.length === 0){
					if(extensions.length === 0){
						// We have tried all base paths with all possible extensions
						// and we still didn't find the file. Time to give up.
						callback(new Error('File couldn\'t be found: ' + fullFilePath));
						return; // Base case
					}

					// Reset base path
					basePaths = originalBasePaths.slice();
					basePath = "";

					// Try the next extension
					extension = extensions.pop();
				}

				tryNext();
				return;
			}

			// File found!
			callback(path.resolve(fullFilePath));
		});
	}

	// Start search;
	tryNext();
};
