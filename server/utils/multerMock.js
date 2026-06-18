function multerMock(options) {
  return {
    single: function(fieldName) {
      return function(req, res, next) {
        req.file = {
          filename: 'mocked_file_' + Date.now() + '.pdf',
          path: 'uploads/mocked_file.pdf'
        };
        next();
      };
    },
    array: function(fieldName) {
      return function(req, res, next) {
        req.files = [];
        next();
      };
    }
  };
}

multerMock.diskStorage = function(options) { return options; };

module.exports = multerMock;
