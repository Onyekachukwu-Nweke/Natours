/* eslint-disable no-lonely-if */
/* eslint-disable no-else-return */
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?/)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // eslint-disable-next-line prettier/prettier
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // REndered Website
    console.error('ERROR', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const handleJWTError = () =>
  new AppError('Invalid Token, Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, Trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknwon error: don't leak error mesaages
    } else {
      // 1.) Log error
      console.error('ERROR', err);

      // 2) Send Generic Message
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  } else {
    // Rendered Website
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });

      // Programming or other unknwon error: don't leak error mesaages
    } else {
      // 1.) Log error
      console.error('ERROR', err);

      // 2) Send Generic Message
      res.status(500).json({
        title: 'Something went wrong',
        msg: 'Pls try again later.',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(err);
    if (error.code === 11000) error = handleDuplicateFieldsDB(err);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }

  next();
};
