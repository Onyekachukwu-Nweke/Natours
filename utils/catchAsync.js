// Catch Error in async functions
// eslint-disable-next-line arrow-body-style, prettier/prettier
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
