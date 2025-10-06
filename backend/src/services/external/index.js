const JahezAPIClient = require('./JahezAPIClient');
const HungerStationAPIClient = require('./HungerStationAPIClient');
const KeetaAPIClient = require('./KeetaAPIClient');

function getClientForPlatform(platformName) {
  switch (platformName?.toLowerCase()) {
    case 'jahez':
      return JahezAPIClient;
    case 'hungerstation':
      return HungerStationAPIClient;
    case 'keeta':
      return KeetaAPIClient;
    default:
      throw new Error(`No API client found for platform: ${platformName}`);
  }
}

module.exports = {
  JahezAPIClient,
  HungerStationAPIClient,
  KeetaAPIClient,
  getClientForPlatform
};