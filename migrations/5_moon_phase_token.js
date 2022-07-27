const PaymentSplitter = artifacts.require("PaymentSplitter");
const MoonPhaseToken = artifacts.require("MoonPhaseToken");

module.exports = function (deployer) {
  const name = "Moon Phase";
  const symbol = "MP";
  const bips = 1000;  // 10%

  deployer.then(async () => {
    const splitter = await PaymentSplitter.deployed();
    await deployer.deploy(MoonPhaseToken, name, symbol, splitter.address, bips);
    const token = await MoonPhaseToken.deployed();
    console.log(`Owner: ${await token.owner()}`);
  });
};
