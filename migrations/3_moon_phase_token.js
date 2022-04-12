const PaymentSplitter = artifacts.require("PaymentSplitter");
const MoonPhaseToken = artifacts.require("MoonPhaseToken");

module.exports = function (deployer) {
  const name = "Moon Phase";
  const symbol = "MP";
  const bips = 1500;  // 15%

  PaymentSplitter.deployed()
    .then(splitter => {
      deployer.deploy(MoonPhaseToken, name, symbol, splitter.address, bips);
    });
};
