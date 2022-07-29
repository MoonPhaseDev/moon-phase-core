const PaymentSplitter = artifacts.require("PaymentSplitter");

const constants = require('./shared/constants');

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    let payees = [
      constants.royalties.teamA.address,
      constants.royalties.teamB.address,
      constants.royalties.teamC.address
    ]
    let shares = [
      constants.royalties.teamA.share,
      constants.royalties.teamB.share,
      constants.royalties.teamC.share
    ]

    console.log(`Migration Warning: PaymentSplitter not yet configured with royalty recipients.`);
    payees = [accounts[0]];  // TODO: royalty recipient addresses
    shares = [1];            // TODO: recipient shares
    await deployer.deploy(PaymentSplitter, payees, shares);
  });
};
