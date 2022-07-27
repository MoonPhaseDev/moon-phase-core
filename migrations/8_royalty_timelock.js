const MoonPhaseToken = artifacts.require("MoonPhaseToken");

const MasterWallet = artifacts.require("MasterWallet");
const TeamJeffWallet = artifacts.require("TeamJeffWallet");
const TeamCompanyWallet = artifacts.require("TeamCompanyWallet");
const TeamCompanyManagementWallet = artifacts.require("TeamCompanyManagementWallet");
const TeamPaceWallet = artifacts.require("TeamPaceWallet");
const RoyaltyTimelock = artifacts.require("RoyaltyTimelock");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // retire privileges granted as the deployer of the token contract.
  // all administration now handled through the MasterWallet; specific actions
  // can be performed via the ActionWallet. There's no need to retain
  // privileges as the deployer at this point.
  deployer.then(async () => {
    // grant privileges
    token = await MoonPhaseToken.deployed();
    master = await MasterWallet.deployed();
    teamWallets = [
      await TeamJeffWallet.deployed(),
      await TeamCompanyWallet.deployed(),
      await TeamPaceWallet.deployed(),
      await TeamCompanyManagementWallet.deployed()
    ];

    // 48-hour delay to change royalties. Only the master wallet may prompt
    // this action, but any participant may execute after the delay, for convenience.
    const hours48 = 48 * 60 * 60;
    const proposers = [master.address];
    const executors = [...new Set([
      ...constants.addresses.company.management,
      ...constants.addresses.company.administration,
      ...constants.addresses.pace.administration,
      ...constants.addresses.koons.administration,
      ...teamWallets.map(contract => contract.address),
      master.address
    ])];

    await deployer.deploy(RoyaltyTimelock, hours48, proposers, executors);
    const timelock = await RoyaltyTimelock.deployed();
    await token.grantRole(web3.utils.soliditySha3('ROYALTY_ROLE'), timelock.address);

    // timelock settings can be updated by master wallet approval
    await timelock.grantRole(web3.utils.soliditySha3('TIMELOCK_ADMIN_ROLE'), master.address);
  });
};
