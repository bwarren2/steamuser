"use strict";
module.exports = {
    options: {
        separator: ';\n'
    },
    dist: {
        src: [
            "bower_components/jquery/dist/jquery.min.js",
            "bower_components/messenger/build/js/messenger.min.js",
            "bower_components/messenger/build/js/messenger-theme-future.js",
            "bower_components/bootstrap/dist/js/bootstrap.min.js",
            "public/js/project.js",
        ],
      dest: "public/built.js",
    },
};
