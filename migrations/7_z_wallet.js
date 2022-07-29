const MoonPhaseToken = artifacts.require("MoonPhaseToken");

const TeamBWallet = artifacts.require("TeamBWallet");
const TeamCWallet = artifacts.require("TeamCWallet");
const ZWallet = artifacts.require("ZWallet");

const constants = require('./shared/constants');

module.exports = function (deployer) {
  // the action wallet allows minting, burning, and evolving. actions
  // require Team A and one other team (B or C) to agree. As the MultiSig
  // contract does not prioritize members in that way ("any k of n"), there
  // are two ways to handle this.
  // First, create a new "B or C" interteam wallet which accepts 1 of 2
  // signatures; this produces a MultiSigWallet chain 3 layers deep.
  // Second, include "j >= 2" A wallets and use "j + 1 of j + 2" confirmation,
  // with the other two wallets being the B and C teams. With j == 2, B
  // and C together are insufficient to proceed without at least 1 A
  // wallet agreeing; to proceed with only A and one other, A confirms with
  // both wallets and one team or the other agrees.
  // To avoid wallet nesting, the latter approach is used.
  deployer.then(async () => {
    const signatories = [
      (await TeamBWallet.deployed()).address,
      (await TeamCWallet.deployed()).address,
      ...constants.addresses.teamA.administration
    ];

    if (signatories.length <= 3) {
      throw new Error("Not enough Team A administrative addresses for 'A plus one' administration");
    }

    await deployer.deploy(ZWallet, signatories, constants.addresses.teamA.administration.length + 1);
    const wallet = await ZWallet.deployed();

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
