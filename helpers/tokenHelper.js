const TAG = 'tokenJwtHelper';

const jwt = require('jsonwebtoken');

const TokenConfig = require('../config/tokenConfig');

const generateJWTAccessToken = (payload, cb) => {
  let options = {
    expiresIn: '15000000s'
  };
  jwt.sign(payload, TokenConfig.jwt.access_token_secret, options, function (err, token) {
    if (err) {
      //throw (err);
      cb(null);
    } else {
      cb(null, token);
    }
  });
};

const generateJWTRefreshToken = (payload, cb) => {
  jwt.sign(payload, TokenConfig.jwt.refresh_token_secret, options, function (err, token) {
    if (err) {
      cb(null);
    } else {
      cb(null, token);
    }
  });
};

const verifyJWTAccessToken = (payload, cb) => {
  if (payload.token == null) {
    cb(null, {});
  } else {
    jwt.verify(payload.token, TokenConfig.jwt.access_token_secret, (err, token) => {
      if (err) {
        cb(null);
      } else {
        cb(null, token);
      }
    });
  }
};

const verifyJWTRefreshToken = (payload, cb) => {
  if (payload.token == null) {
    cb(null, {});
  } else {
    jwt.verify(payload.token, TokenConfig.jwt.refresh_token_secret, (err, token) => {
      if (err) {
        cb(null);
      } else {
        cb(null, token);
      }
    });
  }
};


module.exports = {
  generateJWTAccessToken,
  generateJWTRefreshToken,
  verifyJWTAccessToken,
  verifyJWTRefreshToken
};
