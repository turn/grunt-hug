/*
 * grunt-contrib-hug
 * https://github.com/ozanturgut/grunt-contrib-hug
 *
 * Copyright (c) 2012 Ozan Turgut
 * Licensed under the MIT license.
 * https://github.com/ozanturgut/grunt-hug/blob/master/LICENSE-MIT
 */
module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['grunt.js', 'tasks/*.js', 'lib/**/*.js']
    },

    jshint: {
      all: {
        options:{
          curly: false,
          eqeqeq: true,
          immed: true,
          latedef: false,
          newcap: true,
          noarg: true,
          sub: true,
          undef: true,
          boss: true,
          eqnull: true,
          strict: false,
          node: true,
          loopfunc: true  
        }
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      test: ['./tmp', './**/*.soy.js']
    },

    // Configuration to be run (and then tested).
    hug: {
      advanced: {
        src: "./example/advanced/**/*",
        dest: "./tmp/advanced-example.js",
        exportedVariable: "myApi",
        exports: "./example/advanced/exports.js"
      },
      simple: {
        src: "./example/simple/**/*",
        dest: "./tmp/simple-example.js",
        verbose: true
      }
    },

    // Unit tests.
    test: {
      tasks: ['test/*_test.js']
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // The clean plugin helps in testing.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // By default, lint and run all tests.
  grunt.registerTask('default', 'lint test clean hug');

};