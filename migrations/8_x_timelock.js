const MoonPhaseToken = artifacts.require("MoonPhaseToken");

const YWallet = artifacts.require("YWallet");
const TeamAWallet = artifacts.require("TeamAWallet");
const TeamBWallet = artifacts.require("TeamBWallet");
const TeamCWallet = artifacts.require("TeamCWallet");
const TeamWWallet = artifacts.require("TeamWWallet");

const XTimelock = artifacts.require("XTimelock");

const constants = require('./shared/constants');

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    // grant privileges
    token = await MoonPhaseToken.deployed();
    yWallet = await YWallet.deployed();
    teamWallets = [
      await TeamAWallet.deployed(),
      await TeamBWallet.deployed(),
      await TeamCWallet.deployed(),
      await TeamWWallet.deployed()
    ];

    // 48-hour delay to change royalties. Only the y wallet may prompt
    // this action, but any participant may execute after the delay, for convenience.
    const hours48 = 48 * 60 * 60;
    const proposers = [yWallet.address];
    const executors = [...new Set([
      ...constants.addresses.teamA.administration,
      ...constants.addresses.teamB.administration,
      ...constants.addresses.teamC.management,
      ...constants.addresses.teamC.administration,
      ...teamWallets.map(contract => contract.address),
      yWallet.address
    ])];

    await deployer.deploy(XTimelock, hours48, proposers, executors, accounts[0]);
    const timelock = await XTimelock.deployed();
    await token.grantRole(web3.utils.soliditySha3('ROYALTY_ROLE'), timelock.address);

    // timelock settings can be updated by master wallet approval
    await timelock.grantRole(web3.utils.soliditySha3('TIMELOCK_ADMIN_ROLE'), yWallet.address);
  });
};
