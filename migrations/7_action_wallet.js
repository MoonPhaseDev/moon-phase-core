const MoonPhaseToken = artifacts.require("MoonPhaseToken");

const TeamPaceWallet = artifacts.require("TeamPaceWallet");
const TeamCompanyWallet = artifacts.require("TeamCompanyWallet");
const ActionWallet = artifacts.require("ActionWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // the action wallet allows minting, burning, and evolving. actions
  // require Jeff and one other team (NFMoon or Pace) to agree. As the MultiSig
  // contract does not prioritize members in that way ("any k of n"), there
  // are two ways to handle this.
  // First, create a new "Company or Pace" interteam wallet which accepts 1 of 2
  // signatures; this produces a MultiSigWallet chain 3 layers deep.
  // Second, include "j >= 2" Jeff wallets and use "j + 1 of j + 2" confirmation,
  // with the other two wallets being the Company and Pace teams. With j == 2, Pace
  // and NFMoon together are insufficient to proceed without at least 1 Jeff
  // wallet agreeing; to proceed with only Jeff and one other, Jeff confirms with
  // both wallets and one team or the other agrees.
  // To avoid wallet nesting, the latter approach is used.
  deployer.then(async () => {
    const signatories = [
      (await TeamPaceWallet.deployed()).address,
      (await TeamCompanyWallet.deployed()).address,
      ...constants.addresses.koons.administration
    ];

    if (signatories.length <= 3) {
      throw new Error("Not enough Koons administrative addresses for 'Koons plus one' administration");
    }

    await deployer.deploy(ActionWallet, signatories, constants.addresses.koons.administration.length + 1);
    const wallet = await ActionWallet.deployed();

    // grant privileges
    token = await MoonPhaseToken.deployed();
    const roles = [
      web3.utils.soliditySha3('MINTER_ROLE'),
      web3.utils.soliditySha3('UPDATER_ROLE')
    ];

    for (const role of roles) {
      if (!(await token.hasRole(role, wallet.address))) {
        await token.grantRole(role, wallet.address);
      }
    }
  });
};
