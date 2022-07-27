const TeamCompanyManagementWallet = artifacts.require("TeamCompanyManagementWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // deploy one wallet for each team
  deployer.then(async () => {
    await deployer.deploy(TeamCompanyManagementWallet, constants.addresses.company.management, 1);
    // management wallets have no direct token privileges as yet
  });
};
