var path = require('path'),
	fs = require('fs');

var hugPackage = module.exports = function(srcMap, config){
	var dependencyManager = config.dependencyManager,
		head,
		src,
		contents = [];

	if(config.exports) contents.push(";" + config.exportedVariable + " = ");

	contents.push("(function(){\n");

	// Append the head source
	contents.push(config.headList.map(function(filePath){
		return fs.readFileSync(filePath);
	}).join('\n'));

	// Concat body source
	contents.push(dependencyManager.getList().map(function(filePath){
		return srcMap[filePath];
	}).join('\n'));

	// If we have an exports file, return the object it exports
	if(config.exports) contents.push("return " + dependencyManager.getId(config.exports) + ";");

	contents.push("}());");

	return contents.join("");
};