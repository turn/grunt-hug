var path = require('path'),
	fs = require('fs'),
	createDependencyManager = require('./dependencyManager.js'),
	createResolver = require('./resolver'),
	hugModule = require('./hugModule.js'),
	hugPackage = require('./hugPackage.js'),
	utils = require('./utils.js');

var hug = module.exports = function(options, callback){
	var config = createConfig(options),
		srcList = config.srcList;
	
	if(!callback) callback = config.callback;

	var srcMap = {},
		srcIndex = 0,
		hasError = false,
		waitingCounter = 0;

	function huggedModuleHandler(srcPath, src){
		// If we have an error, we set the hasError flag, so other async calls
		// don't end up pushing the process forward, then we call an error callback
		// if it exists
		if(hasError) return;

		if(srcPath instanceof Error){
			hasError = true;
			var errorMessage = "Unable to read source file: " + srcPath + ". " + src;
			config.log(errorMessage);
			callback(new Error(errorMessage));

			return;
		}
		
		config.debug("[Hug] Processed: " + srcPath);
			
		srcMap[srcPath] = src;

		waitingCounter--;

		// If this module added more src files to hug, process that list		
		if(srcList.length !== srcIndex){
			processSourceList();	
		} else if(waitingCounter === 0){
			// If we're here, we've hugged all modules in the source, 
			// along with their dependencies
			try{
				callback(hugPackage(srcMap, config));
			} catch(e){
				callback(e);
			}

			srcList = void 0;
			srcMap = void 0;
		}
	}

	// We run through the process list until the end. During the processing
	// files may add more files to be processed. If more files are added,
	// the processing will continue (triggered in huggedModuleHandler).
	function processSourceList(){
		var srcPath;

		// Keep track of how many modules we're waiting on so we know when
		// we're done	
		while(srcIndex < srcList.length){
			waitingCounter++;

			config.debug('[Hug] Processing: ' + srcPath);
			hugModule(srcList[srcIndex++], config, function(srcPath, src){
				huggedModuleHandler(srcPath, src);
			});
		}
	}

	processSourceList();
};

var DEFAULT = {
	path: [''],
	extensions: ['', '.js'],
	exportedVariable: "module.exports",
	exportsVariableName: "exports",
	moduleVariableName: "module",
	requireFunctionName: "require"
};

function createConfig(options){
	var srcList = options.src || [],
		headList = options.header || [],
		basePaths = options.path || [],
		extensions = options.extensions || [],
		exportedVariable = options.exportedVariable || DEFAULT.exportedVariable,
		exports = options.exports ? path.resolve(options.exports) : false,
		exportsVariableName = options.exportsVariableName || DEFAULT.exportsVariableName,
		moduleVariableName = options.moduleVariableName || DEFAULT.moduleVariableName,
		requireFunctionName = options.requireFunctionName || DEFAULT.requireFunctionName;

	var moduleHeader = [
		"function(",
		moduleVariableName,
		",",
		exportsVariableName,
		"){",
		moduleVariableName,
		".",
		exportsVariableName,
		"=",
		exportsVariableName,
	";\n"].join("");

	var moduleFooter = "\n;return " + moduleVariableName + "." + exportsVariableName + ";}({},{});";
	
	var dependencyFinder = new RegExp(requireFunctionName + "\\([\'|\"](.*?)[\'|\"]\\)","gi");

	// Resolve head and src file paths
	headList = headList.map(function(item){return path.resolve(item);});

	var uniqueSrcList = [];
	srcList.forEach(function(filePath){
		filePath = path.resolve(filePath);
		if(~headList.indexOf(filePath)) return;

		uniqueSrcList.push(filePath);
	});
	srcList = uniqueSrcList;

	// Normalize string options
	if(typeof basePaths === "string") basePaths = [basePaths];
	basePaths.map(function(item){return path.resolve(item);});

	if(typeof extensions === "string") extensions = [extensions];
	
	// Add default resolver options
	basePaths = DEFAULT.path.concat(basePaths);
	extensions = DEFAULT.extensions.concat(extensions);

	// Helper objects
	var log = options.quiet? utils.noop : console.log.bind(console);
	var debug = options.verbose? console.log.bind(console) : utils.noop;

	var resolver = createResolver(basePaths, extensions, {
		log: log,
		debug: debug
	});
	var dependencyManager = createDependencyManager({
		log: log,
		debug: debug
	});

	var config = {
		resolver: resolver,
		dependencyManager: dependencyManager,
		srcList: srcList,
		headList: headList,
		basePaths: basePaths,
		extensions: extensions,
		exportedVariable: exportedVariable,
		exports: exports,
		exportsVariableName: exportsVariableName,
		moduleVariableName: moduleVariableName,
		requireFunctionName: requireFunctionName,
		moduleHeader: moduleHeader,
		moduleFooter: moduleFooter,
		dependencyFinder: dependencyFinder,
		log: log,
		debug: debug
	};

	return config;
}
