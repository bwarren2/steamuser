"use strict";
module.exports = {
    styles: {
      files: [
        "public/css/*.less",
      ], // which files to watch
      tasks: ["less", "cssmin"],
      options: {
        nospawn: true
      }
    },
    js: {
      files: [
        "public/js/**/*.js",
        "bower_components/**/*.js",
      ],
      tasks: ["concat"],
      options: {
        nospawn: true
      }
    }
}
