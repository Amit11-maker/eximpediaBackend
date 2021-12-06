const TAG = 'envConfig';

const ENV_DEV = 'DEV';
const ENV_PROD = 'PROD';

const ENV_ACTIVE = ENV_DEV;

const HOST_WEB_PANEL = 'https://web.eximpedia.app/'; //http://localhost:3020/

const envDev = {
  host: 'http://localhost:3020',
  mediaContainerFolder: 'stage'
};

const envProd = {
  host: 'https://web.eximpedia.app/',
  mediaContainerFolder: 'release'
};

const prepareEnvironment = function () {
  switch (ENV_ACTIVE) {
    case ENV_DEV:
      return envDev;
    case ENV_PROD:
      return envProd;
    default:
      break;
  }
};

module.exports = {
  HOST_WEB_PANEL,
  prepareEnvironment
};
