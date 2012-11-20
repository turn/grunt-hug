var vm = require('vm'),
	fs = require('fs'),
	path = require('path');

var TEST_FILE_PATH = path.resolve(path.dirname(module.filename), '../tmp/test.js');

exports.hug = {
	test: function(test){
		var expect = {an_env_variable: 'hello, world!'};
		test.expect(1);
		
		var env = {};
		try {
			vm.runInNewContext(fs.readFileSync(TEST_FILE_PATH), env);
		} catch(e) {
			if (e.name === 'SyntaxError') {
				console.error('Syntax error in file!\n' + e.message);
			} else if (e.code === 'ENOENT' || e.code === 'EISDIR') {
				console.error('Config file does not exist!');
			} else {
				console.error('Invalid file!\n', e);
			}
		}


		test.deepEqual(env, expect);
		test.done();
	}
};