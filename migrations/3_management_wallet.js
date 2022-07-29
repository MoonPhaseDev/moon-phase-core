const TeamWWallet = artifacts.require("TeamWWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // deploy one wallet for each team
  deployer.then(async () => {
    await deployer.deploy(TeamWWallet, constants.addresses.teamC.management, 1);
    // management wallets have no direct token privileges as yet
  });
};
