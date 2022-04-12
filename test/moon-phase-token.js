const MoonPhaseToken = artifacts.require('MoonPhaseToken');
const tokens = require('./shared/tokens.js');

contract('MoonPhaseToken', (accounts) => {
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  const SHIPPER_ROLE = web3.utils.soliditySha3('SHIPPER_ROLE');
  const UPDATER_ROLE = web3.utils.soliditySha3('UPDATER_ROLE');
  const ROYALTY_ROLE = web3.utils.soliditySha3('ROYALTY_ROLE');

  const accountNames = ["deployer", "alice", "bob", "carol", "dave", "minter", "shipper", "updater", "royaltyManager", "royaltyReceiver", "transferManager"];
  for (let i = 0; i < accountNames.length; i++) {
    this[accountNames[i]] = accounts[i];
  }

  beforeEach(async () => {
    const { deployer, minter, shipper, updater, royaltyManager, royaltyReceiver } = this;

    this.token = await MoonPhaseToken.new("MoonPhaseToken", "MP", royaltyReceiver, 1500, { from: deployer });
    await this.token.grantRole(MINTER_ROLE, minter);
    await this.token.grantRole(SHIPPER_ROLE, shipper);
    await this.token.grantRole(UPDATER_ROLE, updater);
    await this.token.grantRole(ROYALTY_ROLE, royaltyManager);
  });

  it('should have correct name and symbol and decimal', async () => {
    const name = await this.token.name();
    const symbol = await this.token.symbol();
    assert.equal(name.valueOf(), 'MoonPhaseToken');
    assert.equal(symbol.valueOf(), 'MP');
  });

  it('should have appropriate starting values', async () => {
    const { token, deployer, alice, royaltyManager, royaltyReceiver } = this;

    assert.equal(await token.totalSupply(), '0');
    assert.equal(await token.balanceOf(this.deployer), '0')
    assert.equal(await token.balanceOf(this.alice), '0');
    assert.equal(await token.owner(), deployer);
    assert.equal(await token.royaltyReceiver(), this.royaltyReceiver);
    assert.equal(await token.royaltyPercentBips(), '1500');
  });

  tokens.testRoleAdmin(this);
  tokens.testMint(this);
  tokens.testSafeMint(this);
  tokens.testSetTokenURI(this);
  tokens.testProvenanceRecord(this);
  tokens.testSetTrophyStatus(this);
  tokens.testSetRoyalty(this);
  tokens.testRoyaltyInfo(this);
  tokens.testTransferFrom(this);
  tokens.testSafeTransferFrom(this);
});
