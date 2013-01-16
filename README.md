# grunt-hug [![Build Status](https://secure.travis-ci.org/ozanturgut/grunt-hug.png?branch=master)](http://travis-ci.org/ozanturgut/grunt-hug)

Hug makes maintaining and packaging web applications easier, it is a [grunt](http://gruntjs.com) plugin. 
Tell it how to find your files and it will concatinate them in the right order of dependencies. 
It will also prevent accidental variable leakage between files by wrapping each file in a self-executing 
anonymous function.

## Why Hugging Will Make You Happy

* **Node-like `require` statements.** This tells grunt how your files are related so it can package your files in the
right order. These statements won't be in the final packaged file.
* **Automated dependency resolution.** It will figure out the required order for your files when concatinating.
* **Path searching for dependencies.** Works great with[Bower](http://twitter.github.com/bower/) or 
[NPM](https://npmjs.org/), just add them to the search path.
* **File-level variables** declarations won't leak to the environment and will remain at file-level.
* Allows you to **define an API** for the package which can be used by other applications.

## Target Audience

Hugging occurs at build-time, so an application which needs to load it's dependencies at runtime (lazy loading) 
won't benefit much from hugging -- you'll likely prefer [RequireJS](http://requirejs.org/). 

For frameworks or compiled applications, hugging is awesome. Your code will be clean, safe, and boiler-plate-free. 
As an added benefit, your unhugged code will work in nodejs applications so long as you're not using any 
browser-specific functions (for example, `alert`).

## How to Hug

* Define the variables that a file will expose by assigning them to the `exports` variable. An example:
`exports.numbers = [1,2,3];`.
* Retrieve the exports of another file by using the `require` function. An example:  
`var fileExports = require("[A RELATIVE PATH]")`. 

If you want to assign something as the exports object itself, assign it to `module.exports`. Assigning anything
directly to `exports` would replace the object pointer entirely. If you've done nodejs programming 
before, you should already be used to this, just remember you can't import npm packages like 
you can in node -- currently, hug only imports from relative file paths.

## A Simple Example
Say I have two files:
```javascript
// required.js 
exports.message = "Hello, world!";
```

```javascript
// requiree.js
var otherFile = require('required.js');
alert(otherFile.message);
```

```javascript
// grunt.js
module.exports = function(grunt){
 grunt.initConfig({
 	hug: {
 		simple: {
 			src: "./example/simple/**/*",
 			dest: "./tmp/simple-example.js"
 		}
 	}
 });
}
```

When we run `grunt hug`, simple-example.js is generated. When simple-example.js runs in a browser, 
it will alert "Hello, world!". Note that the window object is never touched, the entire application 
is within a closure, it leaves no trace after it's run. Here is the file itself:

```javascript
// simple-example.js
(function(){
	var __m0=(function(module,exports){module.exports=exports;
		exports.message = "Hello, world!";
		;return module.exports;
	}({},{}));

	var __m1=(function(module,exports){module.exports=exports;
		var otherFile = __m0;

		alert(otherFile.message);
		;return module.exports;
	}({},{}));
}());
```

## A More Complex Example

Say I have the following file structure:
```javascript
src/
    language/
        message/
                aSaying.js
        composer.js
        words.js
    exports.js
    speak.js
grunt.js
```

With the following file contents:

```javascript
// src/language/message/aSaying.js
var theWord = require('../words.js').aWord;
var composer = require('../composer.js');

exports.whatTheySay = composer(theWord);
```

```javascript
// src/language/composer.js
exports = function(anything){
	return "Hello, " + anything + "!";
};
```

```javascript
// src/language/words.js
exports.aWord = "world";
```

```javascript
// src/exports.js
exports.speak = require('./speak.js');
exports.message = require('./language/message/aSaying.js').whatTheySay;
```

```javascript
// src/speak.js
var theMessage = require('./language/message/aSaying.js').whatTheySay;
module.exports = function(){
	alert(theMessage);
};
```

```javascript
// grunt.js
// ...other config stuff...
// in the object passed into initConfig:
hug: {
	advanced: {
      		src: "./src/**/*",
        	dest: "./tmp/advanced-example.js",
        	exportedVariable: "myApi",
        	exports: "./src/exports.js"
	},
}
// ...other config stuff...
```

When grunt is asked to hugs these files, it'll concatinate the files in order of dependencies, 
wrap each file in an anonymous function, and match up dependencies.

Running `advanced-example.js` will create an object named `myApi` in the `window` object with the two variables
defined in exports.js as it's members. Running `myApi.speak()` will alert "Hello, world" in a browser.

## Usage

**If you've never used grunt before, you will find it very useful to review the 
[Getting Started](https://github.com/gruntjs/grunt/blob/0.3-stable/docs/getting_started.md) documentation.**

Inside your `grunt.js` file, in the object you pass to initConfig, add an object named `hug`. 
Inside this object, add one or more objects for different `hug` tasks.

#### Parameters

##### src `String or Array`

One or more comma separated wildcard patterns as well as an array of wildcard patterns. These files define the source
code of your package. Which will be concatinated together.

##### dest `String`

The path for the generated file. Grunt will automatically generate directories if they don't exit.

##### (optional) path `String or Array`

Grunt will use the given paths as a base (in addition to the current directory) when resolving dependencies.

For example if you set `path` to `["./components"]`, and grunt runs in to a file with `require('jquery/jquery.js')`
Grunt will search for the file both in the location relative to where it was declared, and in 
`./components/jquery/jquery.js`. 
This works nicely with package managers such as [Bower](http://twitter.github.com/bower/) or [NPM](https://npmjs.org/).

##### (optional) extensions `String or Array`

Grunt will use this list of extensions when trying to resolve dependencies for files it can't find. By default
the extensions array is ['', '.js'], meaning, grunt will first try to find an exact match and then try to find
the same filename with the '.js' extension. So in the previous example for `path` we could have just used
`require('jquery/jquery')` and it would have worked just as well.

##### (optional) header `String or Array`

File(s) which will be prepended to the beginning of the package, making any variable defined in them package-global.
Note that these files do not use the exports/require pattern -- what they would normally define as global become
limited to the scope of the package, so any file can use their variables without requiring them in.

This is particularly useful for utility functions that you do not want to keep requiring, or for libraries which
require other libraries in order to work.

##### (optional) exports `String`

A path to a file to use as the exports object for the package. Whatever the file exports, will be exported by the entire
package. In essence, this file should define the external api of your package.

##### (optional) exportedVariable `String` (defaults to "exports")

If exports is defined, this will be the variable exported to the environment. Whatever the `exports` file exports 
will be assigned to this variable. By setting the value of this to "module.exports" you can create a package that
can be imported by other hug or nodejs applications.

##### (optional & advanced) moduleVariableName `String` (defaults to "module")

Setting this parameter will break compatibility with importable nodejs modules.
This parameter allows you to overwrite the variable name used to refer to modules internally. This is useful if
you already use the `module` variable for something else.

##### (optional & advanced) exportsVariableName `String` (defaults to "exports")

Setting this parameter will break compatibility with importable nodejs modules.
This parameter allows you to overwrite the variable name used to refer to exports internally. This is useful if
you already use the `exports` variable for something else.

##### (optional & advanced) requireFunctionName `String` (defaults to "require")

Setting this parameter will break compatibility with importable nodejs modules.
This parameter allows you to overwrite the variable name used to refer to the require function. 
This is useful if you already use the `require` variable for something else.

## Importing libraries
Web frameworks and applications that can normally be imported into nodejs applications work as intended.
For example, you can just `require` the underscore library file and use it as you would normally.

Libraries which aren't node-friendly can be made importable without modifying the original file by adding an
'adapter' file. Here's an example on how to make jQuery importable:

```javascript
// jquery-module.js
require('./jquery.js');
module.exports = window.jQuery;
jQuery.noConflict();
```

First we require the actual library so that it gets included in our package and so that it's evaluated before
this file. Then we export out the reference to jQuery. Finally, we call jQuery.noConflict() which returns the
jQuery window variable to it's previous owner (but our exports still points to the one we want).

Now we can import jquery in other files like so: `var $ = require('./jquery-module.js');`.

### Soy Templates
Closure (Soy) templates work beautifully with grunt-hug. Just set your file's namespace to "module.exports" and you're done! 
You can now`require` the generated soy file and it will provide an object with the templates in it.
