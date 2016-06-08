module.exports = {
  development: {
    options: {
      compress: true,
      yuicompress: true,
      optimization: 2,
    },
    files: {
      "public/css/style.css": "public/css/style.less",
    }
  }
}
