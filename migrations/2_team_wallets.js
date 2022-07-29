const TeamAWallet = artifacts.require("TeamAWallet");
const TeamBWallet = artifacts.require("TeamBWallet");
const TeamCWallet = artifacts.require("TeamCWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // deploy one wallet for each team
  deployer.then(async () => {
    await deployer.deploy(TeamAWallet, constants.addresses.teamA.administration, 1);
    await deployer.deploy(TeamBWallet, constants.addresses.teamB.administration, 1);
    await deployer.deploy(TeamCWallet, constants.addresses.teamC.administration, 1);
    // team wallets have no direct token privileges as yet
  });
};
