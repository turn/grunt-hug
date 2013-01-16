var path = require('path'),
	hug = require('../lib/hug.js');

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var complete = this.async(),
			dest = this.file.dest,
			options = this.data,
			gruntConfig = grunt.config.get();

		options.src = grunt.file.expandFiles(this.file.src);
		options.exportedVariable = options.exportedVariable && grunt.template.process(options.exportedVariable, gruntConfig);
		options.header = options.header? grunt.file.expandFiles(options.header) : [];
		options.path = options.path? grunt.file.expandDirs(options.path) : [];
		options.exports = options.exports &&  grunt.template.process(options.exports, gruntConfig);
		options.moduleVariableName = options.moduleVariableName && grunt.template.process(options.moduleVariableName, gruntConfig);
		options.exportsVariableName = options.exportsVariableName && grunt.template.process(options.exportsVariableName, gruntConfig);
		options.requireFunctionName = options.requireFunctionName && grunt.template.process(options.requireFunctionName, gruntConfig);
		
		hug(options, function(content){
			if(content instanceof Error){
				grunt.log.error(content);
				complete(false);
			} else {
				grunt.file.write(dest, content);
				grunt.log.ok('File "' + dest + '" created.');
				complete(true);
			}
		});
	});
};
