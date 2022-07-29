const MoonPhaseToken = artifacts.require("MoonPhaseToken");

module.exports = function (deployer) {
  // retire privileges granted as the deployer of the token contract.
  // all administration now handled through the YWallet; specific actions
  // can be performed via the ZWallet. There's no need to retain
  // privileges as the deployer at this point.
  deployer.then(async () => {
    // grant privileges
    token = await MoonPhaseToken.deployed();
    const roles = [
      web3.utils.soliditySha3('MINTER_ROLE'),
      web3.utils.soliditySha3('SHIPPER_ADMIN'),
      web3.utils.soliditySha3('UPDATER_ROLE'),
      web3.utils.soliditySha3('ROYALTY_ROLE'),
      web3.utils.soliditySha3('MINTER_ADMIN'),
      web3.utils.soliditySha3('SHIPPER_ADMIN'),
      web3.utils.soliditySha3('UPDATER_ADMIN'),
      web3.utils.soliditySha3('ROYALTY_ADMIN')
    ];

    // shortcut: the deploying account is the owner
    const me = await token.owner();

    for (const role of roles) {
      if (await token.hasRole(role, me)) {
        await token.renounceRole(role, me);
      }
    }
  });
};
