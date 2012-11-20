# grunt-contrib-hug [![Build Status](https://secure.travis-ci.org/ozanturgut/grunt-contrib-hug.png?branch=master)](http://travis-ci.org/ozanturgut/grunt-contrib-hug)

Hug makes developing web applications easier. You provide a directory, grunt wraps them up in anonymous functions and concatinates them with dependency resolution in to a destination file.

## Why Hugging Will Make You Happy

* It scopes variable declarations to the file they're declared in (as in, they won't leak to the environment).
* You can `require([relativePath])` other files to bring them into the current scope.
* Concatination of your files with dependency resolution (done by paying attention to your `require` statements).
* It can optionally generate one variable to encompasing your whole API.

## An Example

Say I have the following file structure:
```
src/
    language/
        message/
                aSaying.js
        words.js
        speaker.js
    init.js
grunt.js
```

With the following file contents:

``` javascript
// src/init.js
var theMessage = require('language/message/aSaying.js').whatTheySay;
console.log(theMessage);
```

``` javascript
// src/language/message/aSaying.js
var theWord = require('../words.js').aWord;
var speaker = require('../speaker.js');

exports.whatTheySay = speaker(theWord);
```

``` javascript
// src/language/words.js
exports.aWord = "world";
````

``` javascript
// src/language/speaker.js
exports = function(anything){
	return "Hello, " + anything + "!";
};
```

``` javascript
// grunt.js
// ...other config stuff...
// in the object passed into initConfig:
hug: {
	dist: {
		src: 'src',
		dest: 'build/hi.js'
	}
}
// ...other config stuff...
```

When grunt is asked to hug this source tree, it'll concatinate the files in order of dependencies, and wrap each file in an anonymous function, and match up dependencies.

Running `hi.js` will output "Hello, world!" on the console, with no trace of the program ever running (nothing leaked to the global scope).

## Usage

Inside your `grunt.js` file, in the object you pass to initConfig, add a section named `hug`. Inside this section, add 1 or more subsections for different `hug` tasks.

#### Parameters

##### src ```string```

This defines the root directory of your source tree. Any JS file under this directory will become part of the generated file.

##### dest ```string```

This defines what the path for the generated file should be. Grunt will automatically generate directories if they don't exit.

##### (optional) exportsVariable ```string```

This is an optional parameter. If provided, the generated file will produce a global variable with the given name holding the export tree. For example, if we had set `exportsVariable: 'hugExample'` for the example above, and ran the generated script, we would end up with a global variable like this:

``` javascript
console.log(hugExample);
// Output:
//	hugExample: {
//		language: {
//			message: {
//				aSaying: {
//				whatTheySay: 'Hello, world!'
//			},
//			words: {
//				aWord: "world"
//			},
//			speaker: function(anything){return "Hello, " + anything + "!";}
//		},
//		init: {}
//	}
```
Note that you can't use the exportsVariable in the source code, you have to use the `require` method to access the exports of other files.

## Known Limitations and Possibilities
* You cannot `require` a file outside of your source tree. For third-party libraries use grunt `concat` to concatinate them ahead of the hug generated file. You'll also likely want to minify the generated file.
* You can set `exportsVariable` to `exports` and use the generated file in another source tree (which can then also be hugged) as a way to cleanly encapsulate your APIs.
