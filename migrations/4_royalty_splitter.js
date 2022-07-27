const PaymentSplitter = artifacts.require("PaymentSplitter");

const constants = require('./shared/constants');

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    let payees = [
      constants.royalties.company.address,
      constants.royalties.pace.address,
      constants.royalties.koons.address
    ]
    let shares = [
      constants.royalties.company.share,
      constants.royalties.pace.share,
      constants.royalties.koons.share
    ]

    console.log(`Migration Warning: PaymentSplitter not yet configured with royalty recipients.`);
    payees = [accounts[0]];  // TODO: royalty recipient addresses
    shares = [1];            // TODO: recipient shares
    await deployer.deploy(PaymentSplitter, payees, shares);
  });
};
