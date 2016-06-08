module.exports = {
  development: {
    options: {
      compress: true,
      yuicompress: true,
      optimization: 2,
    },
    files: {
      "public/css/project.css": "public/css/project.less",
    }
  }
}
