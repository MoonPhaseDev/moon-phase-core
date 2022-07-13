const TeamJeffWallet = artifacts.require("TeamJeffWallet");
const TeamPaceWallet = artifacts.require("TeamPaceWallet");
const TeamCompanyWallet = artifacts.require("TeamCompanyWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // deploy one wallet for each team
  deployer.then(async () => {
    await deployer.deploy(TeamJeffWallet, constants.addresses.koons.administration, 1);
    await deployer.deploy(TeamPaceWallet, constants.addresses.pace.administration, 1);
    await deployer.deploy(TeamCompanyWallet, constants.addresses.company.administration, 1);
    // team wallets have no direct token privileges as yet
  });
};
