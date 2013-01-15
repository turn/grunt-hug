var path = require('path'),
	hug = require('../lib/hug.js');

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var complete = this.async(),
			srcList = grunt.file.expandFiles(this.file.src),
			options,
			gruntConfig = grunt.config.get(),
			destPath = this.file.dest;

		options = {
			exportedVariable: this.data.exportedVariable && grunt.template.process(this.data.exportedVariable, gruntConfig),
			exports: this.data.exports && grunt.template.process(this.data.exports, gruntConfig),
			headList: this.data.header? grunt.file.expandFiles(this.data.header) : [],
			moduleVariableName: this.data.moduleVariableName && grunt.template.process(this.data.moduleVariableName, gruntConfig),
			exportsVariableName: this.data.exportsVariableName && grunt.template.process(this.data.exportsVariableName, gruntConfig),
			requireFunctionName: this.data.requireFunctionName && grunt.template.process(this.data.requireFunctionName, gruntConfig),
			success: function(content){
				grunt.file.write(destPath, content);
				grunt.log.writeln('File "' + destPath + '" created.');
				complete(true);
			},
			error: function(message){
				grunt.log.error(message);
				complete(false);
			}
		};

		hug(srcList, options);
	});
};