"use strict";
module.exports = {
    options: {
        separator: ';\n'
    },
    dist: {
        src: [
            "bower_components/messenger/build/js/messenger.min.js",
            "bower_components/messenger/build/js/messenger-theme-future.js",
            "public/js/project.js",
        ],
      dest: "public/built.js",
    },
};
