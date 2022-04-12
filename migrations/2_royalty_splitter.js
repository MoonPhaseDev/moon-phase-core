const PaymentSplitter = artifacts.require("PaymentSplitter");

module.exports = function (deployer, network, accounts) {
  console.log(`Migration Warning: PaymentSplitter not yet configured with royalty recipients.`);
  const payees = [accounts[0]];  // TODO: royalty recipient addresses
  const shares = [1];            // TODO: recipient shares
  deployer.deploy(PaymentSplitter, payees, shares);
};
