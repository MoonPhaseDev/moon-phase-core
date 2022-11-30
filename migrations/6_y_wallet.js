const MoonPhaseToken = artifacts.require("MoonPhaseToken");

const TeamAWallet = artifacts.require("TeamAWallet");
const TeamBWallet = artifacts.require("TeamBWallet");
const TeamWWallet = artifacts.require("TeamWWallet");
const YWallet = artifacts.require("YWallet");

module.exports = function (deployer) {
  // the master wallet has all admin privileges and requires full 3-party consensus
  // for any action. It is the sole royalty-changing authority and a fallback for
  // any other action, including establishing new administrative policies.
  deployer.then(async () => {
    const teamWallets = [
      await TeamAWallet.deployed(),
      await TeamBWallet.deployed(),
      await TeamWWallet.deployed()
    ];

    await deployer.deploy(YWallet, teamWallets.map(w => w.address), teamWallets.length);
    const wallet = await YWallet.deployed();

    // grant privileges
    token = await MoonPhaseToken.deployed();
    const roles = [
      web3.utils.soliditySha3('MINTER_ADMIN'),
      web3.utils.soliditySha3('FILTER_ADMIN'),
      web3.utils.soliditySha3('SHIPPER_ADMIN'),
      web3.utils.soliditySha3('UPDATER_ADMIN'),
      web3.utils.soliditySha3('ROYALTY_ADMIN')
    ];

    for (const role of roles) {
      if (!(await token.hasRole(role, wallet.address))) {
        await token.grantRole(role, wallet.address);
      }
    }
  });
};
