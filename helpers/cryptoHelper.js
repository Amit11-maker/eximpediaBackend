const TAG = 'cryptoHelper';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const generateAutoSaltHashedPassword = (plainTextPassword, cb) => {

  try {
    bcrypt.hash(plainTextPassword, SALT_ROUNDS, function (err, hashedpassword) {
      cb(null, hashedpassword);
    });
  } catch (error) {
    cb(error);
  }

};

const verifyPasswordMatch = (hashedPassword, plainTextPassword, cb) => {
  // console.log(hashedPassword);
  // console.log(plainTextPassword);
  try {
    bcrypt.compare(plainTextPassword, hashedPassword, function (error, match) {
      if (error) cb(error);
      console.log(match);
      cb(null, match);
    });
  } catch (error) {
    cb(error);
  }

};

const generateRandomPassword = () => {
  var pass = '';
  var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    'abcdefghijklmnopqrstuvwxyz0123456789@#$';

  for (i = 1; i <= 6; i++) {
    var char = Math.floor(Math.random() *
      str.length + 1);

    pass += str.charAt(char)
  }

  return pass;
};

module.exports = {
  generateAutoSaltHashedPassword,
  verifyPasswordMatch,
  generateRandomPassword
};
