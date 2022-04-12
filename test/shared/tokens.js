const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const MockContract = artifacts.require('MockContract');
const MockERC721Receiver = artifacts.require('MockERC721Receiver');

const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers').constants;
const MAX_INT_STR = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

const MINTER_ADMIN = web3.utils.soliditySha3('MINTER_ADMIN');
const SHIPPER_ADMIN = web3.utils.soliditySha3('SHIPPER_ADMIN');
const UPDATER_ADMIN = web3.utils.soliditySha3('UPDATER_ADMIN');
const ROYALTY_ADMIN = web3.utils.soliditySha3('ROYALTY_ADMIN');

const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
const SHIPPER_ROLE = web3.utils.soliditySha3('SHIPPER_ROLE');
const UPDATER_ROLE = web3.utils.soliditySha3('UPDATER_ROLE');
const ROYALTY_ROLE = web3.utils.soliditySha3('ROYALTY_ROLE');

const ROLE_PERMISSIONS = {
  deployer: [MINTER_ROLE, SHIPPER_ROLE, UPDATER_ROLE, ROYALTY_ROLE],
  minter: [MINTER_ROLE],
  shipper: [SHIPPER_ROLE],
  updater: [UPDATER_ROLE],
  royaltyManager: [ROYALTY_ROLE]
}

function testUtilityConfig(tester, accountNames = ["deployer", "alice", "bob", "carol", "dave", "minter", "shipper", "updater", "royaltyManager", "royaltyReceiver"]) {
  it("testing utility is properly configured", async () => {
    assert.ok(!!tester.token, "token is set");
    for (const accountName of accountNames) {
      assert.ok(!!tester[accountName], `account "${accountName}" is set`);
    }
    for (const accountName in ROLE_PERMISSIONS) {
      const account = tester[accountName];
      if (accountNames.includes(accountName)) {
        for (const role of ROLE_PERMISSIONS[accountName]) {
          assert.ok(await tester.token.hasRole(role, account), `account "${accountName}" has role ${role}`)
        }
      }
    }
  });
}

function testRoleAdmin(tester, testConfig = true) {
  context('grantRole', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "bob", "carol", "dave", "minter", "shipper", "updater", "royaltyManager"]);

    it('deployer can grant admin privileges', async () => {
      const { token, alice, bob, carol, dave, deployer } = tester;
      const names = ["minter", "shipper", "updater", "royalty"];
      const adminRoles = [MINTER_ADMIN, SHIPPER_ADMIN, UPDATER_ADMIN, ROYALTY_ADMIN];
      const actionRoles = [MINTER_ROLE, SHIPPER_ROLE, UPDATER_ROLE, ROYALTY_ROLE];
      const users = [alice, bob, carol, dave];

      for (let i = 0; i <  adminRoles.length; i++) {
        const name = names[i];
        const admin = adminRoles[i];
        const actionRole = actionRoles[i];
        const adminUser = users[i];
        const anotherAdminUser = users[(i + 1) % users.length];
        const actionUser = users[(i + 2) % users.length];

        await token.grantRole(admin, adminUser, { from:deployer });
        assert.ok(await token.hasRole(admin, adminUser), `deployer granted ${name} admin authority`);
        await token.grantRole(actionRole, actionUser, { from:adminUser });
        assert.ok(await token.hasRole(actionRole, actionUser), `new ${name} admins can grant ${name} authority`);
        await token.grantRole(admin, anotherAdminUser, { from:adminUser });
        assert.ok(await token.hasRole(admin, anotherAdminUser), `new ${name} admins can grant ${name} admin status`);
      }
    });
  });
}

function testMint(tester, testConfig = true) {
  context('mint', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice",  "bob", "carol", "minter", "shipper"]);

    it('non-minters cannot mint', async () =>  {
      const { token, alice, bob, carol, shipper } = tester;

      await expectRevert(
        token.mint(alice, 0, "", { from:bob }),
        "MoonPhaseToken: must have minter role to mint",
      );

      await expectRevert(
        token.mint(carol, 0, "", { from:shipper }),
        "MoonPhaseToken: must have minter role to mint",
      );
    });

    it('minting creates a token owned by the address provided', async () => {
      const { token, deployer, alice, bob, minter } = tester;

      await token.mint(alice, 77, "token_77_URI", { from:deployer });

      assert.equal(await token.totalSupply(), '1');
      assert.equal(await token.balanceOf(alice), '1');
      assert.equal(await token.balanceOf(deployer), '0');

      assert.equal(await token.tokenByIndex(0), '77');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '77');

      await token.mint(alice, 2, "token_2_URI", { from:minter });
      await token.mint(alice, 3, "token_3_URI", { from:minter });
      await token.mint(alice, 4, "token_4_URI", { from:minter });
      await token.mint(bob, 101, "token_101_URI", { from:minter });
      await token.mint(bob, 102, "token_102_URI", { from:minter });
      await token.mint(bob, 1234567890, "token_1234567890_URI", { from:minter });
      await token.mint(bob, 9999, "token_9999_URI", { from:minter });
      await token.mint(bob, "123456789123456789123456789", "token_123456789123456789123456789_URI", { from:minter });

      assert.equal(await token.totalSupply(), '9');
      assert.equal(await token.balanceOf(alice), '4');
      assert.equal(await token.balanceOf(bob), '5');

      assert.equal(await token.tokenByIndex(0), '77');
      assert.equal(await token.tokenByIndex(1), '2');
      assert.equal(await token.tokenByIndex(2), '3');
      assert.equal(await token.tokenByIndex(3), '4');
      assert.equal(await token.tokenByIndex(4), '101');
      assert.equal(await token.tokenByIndex(5), '102');
      assert.equal(await token.tokenByIndex(6), '1234567890');
      assert.equal(await token.tokenByIndex(7), '9999');
      assert.equal(await token.tokenByIndex(8), '123456789123456789123456789');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '77');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 1), '2');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 2), '3');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 3), '4');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 0), '101');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 1), '102');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 2), '1234567890');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 3), '9999');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 4), '123456789123456789123456789');

      assert.equal(await token.tokenURI(77), "token_77_URI");
      assert.equal(await token.tokenURI(2), "token_2_URI");
      assert.equal(await token.tokenURI(3), "token_3_URI");
      assert.equal(await token.tokenURI(4), "token_4_URI");
      assert.equal(await token.tokenURI(101), "token_101_URI");
      assert.equal(await token.tokenURI(102), "token_102_URI");
      assert.equal(await token.tokenURI(9999), "token_9999_URI");
      assert.equal(await token.tokenURI("123456789123456789123456789"), "token_123456789123456789123456789_URI");
    });
  });
}

function testSafeMint(tester, testConfig = true) {
  context('safeMint', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice",  "bob", "carol", "minter", "shipper"]);

    it('non-minters cannot safeMint', async () =>  {
      const { token, alice, bob, carol, shipper } = tester;

      await expectRevert(
        token.safeMint(alice, 0, "0x", "uri", { from:bob }),
        "MoonPhaseToken: must have minter role to safeMint",
      );

      await expectRevert(
        token.safeMint(carol, 0, "0x1234", "uri", { from:shipper }),
        "MoonPhaseToken: must have minter role to safeMint",
      );
    });

    it('safeMinting creates a token owned by the address provided', async () => {
      const { token, deployer, alice, bob, minter } = tester;

      await token.safeMint(alice, 77, "0x", "token_77_URI", { from:deployer });

      assert.equal(await token.totalSupply(), '1');
      assert.equal(await token.balanceOf(alice), '1');
      assert.equal(await token.balanceOf(deployer), '0');

      assert.equal(await token.tokenByIndex(0), '77');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '77');

      await token.safeMint(alice, 2, "0x2", "token_2_URI", { from:minter });
      await token.safeMint(alice, 3, "0x3", "token_3_URI", { from:minter });
      await token.safeMint(alice, 4, "0x4", "token_4_URI", { from:minter });
      await token.safeMint(bob, 101, "0x101", "token_101_URI", { from:minter });
      await token.safeMint(bob, 102, "0x102", "token_102_URI", { from:minter });
      await token.safeMint(bob, 1234567890, "0x1234567890", "token_1234567890_URI", { from:minter });
      await token.safeMint(bob, 9999, "0x999", "token_9999_URI", { from:minter });
      await token.safeMint(
        bob,
        "123456789123456789123456789",
        "0x123456789123456789123456789123456789123456789123456789123456789123456789123456789",
        "token_123456789123456789123456789_URI",
        { from:minter }
      );

      assert.equal(await token.totalSupply(), '9');
      assert.equal(await token.balanceOf(alice), '4');
      assert.equal(await token.balanceOf(bob), '5');

      assert.equal(await token.tokenByIndex(0), '77');
      assert.equal(await token.tokenByIndex(1), '2');
      assert.equal(await token.tokenByIndex(2), '3');
      assert.equal(await token.tokenByIndex(3), '4');
      assert.equal(await token.tokenByIndex(4), '101');
      assert.equal(await token.tokenByIndex(5), '102');
      assert.equal(await token.tokenByIndex(6), '1234567890');
      assert.equal(await token.tokenByIndex(7), '9999');
      assert.equal(await token.tokenByIndex(8), '123456789123456789123456789');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '77');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 1), '2');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 2), '3');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 3), '4');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 0), '101');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 1), '102');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 2), '1234567890');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 3), '9999');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 4), '123456789123456789123456789');

      assert.equal(await token.tokenURI(77), "token_77_URI");
      assert.equal(await token.tokenURI(2), "token_2_URI");
      assert.equal(await token.tokenURI(3), "token_3_URI");
      assert.equal(await token.tokenURI(4), "token_4_URI");
      assert.equal(await token.tokenURI(101), "token_101_URI");
      assert.equal(await token.tokenURI(102), "token_102_URI");
      assert.equal(await token.tokenURI(9999), "token_9999_URI");
      assert.equal(await token.tokenURI("123456789123456789123456789"), "token_123456789123456789123456789_URI");
    });

    it('safeMint reverts for non-receiver contract', async () => {
      const { token, deployer, minter } = tester;

      const receiver = await MockContract.new();

      await expectRevert(
        token.safeMint(receiver.address, 77, "0x", "token_77_URI", { from:deployer }),
        "ERC721: transfer to non ERC721Receiver implementer"
      );

      await expectRevert(
        token.safeMint(receiver.address, 100, "0x100", "token_100_URI", { from:minter }),
        "ERC721: transfer to non ERC721Receiver implementer"
      );
    });

    it('safeMint creates tokens owned by receiver contract', async () => {
      const { token, deployer, alice, minter } = tester;

      const receiver = await MockERC721Receiver.new();

      let res = await token.safeMint(receiver.address, 77, "0x77", "token_77_URI", { from:deployer });

      assert.equal(await token.totalSupply(), '1');
      assert.equal(await token.balanceOf(receiver.address), '1');
      assert.equal(await token.balanceOf(alice), '0');
      assert.equal(await token.balanceOf(deployer), '0');

      assert.equal(await token.tokenByIndex(0), '77');
      assert.equal(await token.tokenOfOwnerByIndex(receiver.address, 0), '77');

      await expectEvent.inTransaction(res.tx, receiver, 'ERC721Received', {
        operator: deployer,
        from: ZERO_ADDRESS,
        tokenId: '77',
        data: '0x77'
      });

      res = await token.safeMint(receiver.address, 9999, "0x9999", "token_9999_URI", { from:minter });

      assert.equal(await token.totalSupply(), '2');
      assert.equal(await token.balanceOf(receiver.address), '2');
      assert.equal(await token.balanceOf(alice), '0');
      assert.equal(await token.balanceOf(deployer), '0');

      assert.equal(await token.tokenByIndex(1), '9999');
      assert.equal(await token.tokenOfOwnerByIndex(receiver.address, 1), '9999');

      await expectEvent.inTransaction(res.tx, receiver, 'ERC721Received', {
        operator: minter,
        from: ZERO_ADDRESS,
        tokenId: '9999',
        data: '0x9999'
      });
    });
  });
}

function testSetTokenURI(tester, testConfig = true) {
  context('setTokenURI', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "updater", "minter"]);

    it('non-updaters cannot setTokenURI', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await token.mint(alice, 105, "", { from:minter });

      await expectRevert(
        token.setTokenURI(105, "http://my-site.com",  { from:alice }),
        "MoonPhaseToken: must have updater role to setTokenURI"
      );

      await expectRevert(
        token.setTokenURI(105, "bad URI",  { from:minter }),
        "MoonPhaseToken: must have updater role to setTokenURI"
      );
    });

    it('cannot setTokenURI for nonexistent token', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await token.mint(alice, 105, "", { from:minter });

      await expectRevert(
        token.setTokenURI(104, "http://content.com",  { from:updater }),
        "ERC721URIStorage: URI set of nonexistent token"
      );

      await expectRevert(
        token.setTokenURI(0, "content URI",  { from:deployer }),
        "ERC721URIStorage: URI set of nonexistent token"
      );
    });

    it('setTokenURI alters URI for the specified token', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await token.mint(alice, 105, "uri 105", { from:minter });
      await token.mint(alice, 106, "uri 106", { from:minter });
      await token.mint(alice, 107, "uri 107", { from:minter });

      // check URIs
      assert.equal(await token.tokenURI(105), "uri 105");
      assert.equal(await token.tokenURI(106), "uri 106");
      assert.equal(await token.tokenURI(107), "uri 107");

      await token.setTokenURI(106, "updated 106", { from:updater });
      assert.equal(await token.tokenURI(105), "uri 105");
      assert.equal(await token.tokenURI(106), "updated 106");
      assert.equal(await token.tokenURI(107), "uri 107");

      await token.setTokenURI(107, "updated 107", { from:deployer });
      assert.equal(await token.tokenURI(105), "uri 105");
      assert.equal(await token.tokenURI(106), "updated 106");
      assert.equal(await token.tokenURI(107), "updated 107");
    });

    it('setTokenURI emits TokenURIChanged event', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await token.mint(alice, 105, "uri 105", { from:minter });
      await token.mint(alice, 106, "uri 106", { from:minter });
      await token.mint(alice, 107, "uri 107", { from:minter });

      let res = await token.setTokenURI(106, "updated 106", { from:updater });
      await expectEvent.inTransaction(res.tx, token, 'TokenURIChanged', {
        tokenId: '106',
        tokenURI: 'updated 106'
      });

      res = await token.setTokenURI(107, "updated 107", { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'TokenURIChanged', {
        tokenId: '107',
        tokenURI: 'updated 107'
      });
    });
  });
}

function testProvenanceRecord(tester, testConfig = true) {
  context('setProvenanceRecord / setProvenanceHash', () => {
    const docUri = "http://my-site.com/provenanceRecord";
    const docHash = "4974e0f0f6961cb43660f2e5bac939f516da62affd11ab3283ce5e97a4168d2e";
    const hash = "7c7acda0cf2703a2d9768047126bc6a8c2f0ea8af647bcca760963485aac4555";
    const hash2 = "929d068eb2eb7b1ba2ecf0136dcad0fa8cdb536dcc6540c1755c7a868b95e568";

    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "updater", "minter"]);

    it('non-updaters cannot setProvenanceRecord', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await expectRevert(
        token.setProvenanceRecord(docUri, docHash, hash, { from:alice }),
        "MoonPhaseToken: must have updater role to setProvenanceRecord"
      );

      await expectRevert(
        token.setProvenanceRecord("docUri", "docHash", "hash", { from:minter }),
        "MoonPhaseToken: must have updater role to setProvenanceRecord"
      );
    });

    it('setProvenanceRecord updates `provenanceDocumentationURI`, `provenanceDocumentationHash`, and `provenanceHash`', async () => {
      const { token, deployer, updater } = tester;

      // check initial values
      assert.equal(await token.provenanceDocumentationURI(), "");
      assert.equal(await token.provenanceDocumentationHash(), "");
      assert.equal(await token.provenanceHash(), "");

      await token.setProvenanceRecord("docUri", "docHash", "hash", { from:updater });
      assert.equal(await token.provenanceDocumentationURI(), "docUri");
      assert.equal(await token.provenanceDocumentationHash(), "docHash");
      assert.equal(await token.provenanceHash(), "hash");

      await token.setProvenanceRecord(docUri, docHash, hash, { from:deployer });
      assert.equal(await token.provenanceDocumentationURI(), docUri);
      assert.equal(await token.provenanceDocumentationHash(), docHash);
      assert.equal(await token.provenanceHash(), hash);
    });

    it('setProvenanceRecord emits ProvenanceRecordChanged event', async () => {
      const { token, deployer, updater } = tester;

      // check initial values
      let res = await token.setProvenanceRecord("docUri", "docHash", "hash", { from:updater });
      await expectEvent.inTransaction(res.tx, token, 'ProvenanceRecordChanged', {
        documentationURI: "docUri",
        documentationHash: "docHash",
        provenanceHash: "hash"
      });

      res = await token.setProvenanceRecord(docUri, docHash, hash, { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'ProvenanceRecordChanged', {
        documentationURI: docUri,
        documentationHash: docHash,
        provenanceHash: hash
      });
    });

    it('non-updaters cannot setProvenanceHash', async () => {
      const { token, deployer, alice, updater, minter } = tester;

      await expectRevert(
        token.setProvenanceHash(hash, { from:alice }),
        "MoonPhaseToken: must have updater role to setProvenanceHash"
      );

      await expectRevert(
        token.setProvenanceHash("hash", { from:minter }),
        "MoonPhaseToken: must have updater role to setProvenanceHash"
      );
    });

    it('setProvenanceHash updates `provenanceHash` but not `provenanceDocumentation[*]`', async () => {
      const { token, deployer, updater } = tester;

      // check initial values
      assert.equal(await token.provenanceDocumentationURI(), "");
      assert.equal(await token.provenanceDocumentationHash(), "");
      assert.equal(await token.provenanceHash(), "");

      // update hash
      await token.setProvenanceHash("hash", { from:updater });
      assert.equal(await token.provenanceDocumentationURI(), "");
      assert.equal(await token.provenanceDocumentationHash(), "");
      assert.equal(await token.provenanceHash(), "hash");

      // alter documentation
      await token.setProvenanceRecord(docUri, docHash, hash, { from:deployer });
      assert.equal(await token.provenanceDocumentationURI(), docUri);
      assert.equal(await token.provenanceDocumentationHash(), docHash);
      assert.equal(await token.provenanceHash(), hash);

      // update hash
      await token.setProvenanceHash(hash2, { from:deployer });
      assert.equal(await token.provenanceDocumentationURI(), docUri);
      assert.equal(await token.provenanceDocumentationHash(), docHash);
      assert.equal(await token.provenanceHash(), hash2);
    });

    it('setProvenanceHash emits ProvenanceRecordChanged event', async () => {
      const { token, deployer, updater } = tester;

      // update hash
      let res = await token.setProvenanceHash("hash", { from:updater });
      await expectEvent.inTransaction(res.tx, token, 'ProvenanceRecordChanged', {
        documentationURI: "",
        documentationHash: "",
        provenanceHash: "hash"
      });

      // alter documentation
      await token.setProvenanceRecord(docUri, docHash, hash, { from:deployer });

      // update hash
      res = await token.setProvenanceHash(hash2, { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'ProvenanceRecordChanged', {
        documentationURI: docUri,
        documentationHash: docHash,
        provenanceHash: hash2
      });
    });
  });
}

function testSetTrophyStatus(tester, testConfig = true) {
  context('setTrophyStatus', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "shipper", "minter"]);

    it('non-shipper cannot setTokenURI', async () => {
      const { token, deployer, alice, shipper, minter } = tester;

      await token.mint(alice, 105, "", { from:minter });

      await expectRevert(
        token.setTrophyStatus(105, 1, { from:alice }),
        "MoonPhaseToken: must have shipper role to setTrophyStatus"
      );

      await expectRevert(
        token.setTrophyStatus(105, 1, { from:minter }),
        "MoonPhaseToken: must have shipper role to setTrophyStatus"
      );
    });

    it('cannot setTrophyStatus for nonexistent token', async () => {
      const { token, deployer, alice, shipper, minter } = tester;

      await token.mint(alice, 105, "", { from:minter });

      await expectRevert(
        token.setTrophyStatus(104, 1, { from:shipper }),
        "MoonPhaseToken: setTrophyStatus of nonexistent token"
      );

      await expectRevert(
        token.setTrophyStatus(104, 1, { from:deployer }),
        "MoonPhaseToken: setTrophyStatus of nonexistent token"
      );
    });

    it('cannot setTrophyStatus to invalid status code', async () => {
      const { token, deployer, alice, shipper, minter } = tester;

      await token.mint(alice, 105, "", { from:minter });

      await expectRevert(
        token.setTrophyStatus(105, 4, { from:shipper }),
        "MoonPhaseToken: setTrophyStatus for invalid status"
      );

      await expectRevert(
        token.setTrophyStatus(105, 1000000, { from:deployer }),
        "MoonPhaseToken: setTrophyStatus for invalid status"
      );
    });

    it('setTrophyStatus updates "trophyStatus" of specified token', async () => {
      const { token, deployer, alice, shipper, minter } = tester;

      await token.mint(alice, 105, "uri 105", { from:minter });
      await token.mint(alice, 106, "uri 106", { from:minter });
      await token.mint(alice, 107, "uri 107", { from:minter });

      // check status
      assert.equal(await token.trophyStatus(105), "In Progress");
      assert.equal(await token.trophyStatus(106), "In Progress");
      assert.equal(await token.trophyStatus(107), "In Progress");

      await token.setTrophyStatus(106, 1, { from:shipper });

      assert.equal(await token.trophyStatus(105), "In Progress");
      assert.equal(await token.trophyStatus(106), "Ready to Ship");
      assert.equal(await token.trophyStatus(107), "In Progress");

      await token.setTrophyStatus(107, 2, { from:deployer });
      assert.equal(await token.trophyStatus(105), "In Progress");
      assert.equal(await token.trophyStatus(106), "Ready to Ship");
      assert.equal(await token.trophyStatus(107), "In Transit");

      await token.setTrophyStatus(107, 3, { from:deployer });
      assert.equal(await token.trophyStatus(105), "In Progress");
      assert.equal(await token.trophyStatus(106), "Ready to Ship");
      assert.equal(await token.trophyStatus(107), "Received");
    });

    it('setTrophyStatus emits TrophyStatusChanged event', async () => {
      const { token, deployer, alice, shipper, minter } = tester;

      await token.mint(alice, 105, "uri 105", { from:minter });
      await token.mint(alice, 106, "uri 106", { from:minter });
      await token.mint(alice, 107, "uri 107", { from:minter });

      let res = await token.setTrophyStatus(106, 1, { from:shipper });
      await expectEvent.inTransaction(res.tx, token, 'TrophyStatusChanged', {
        tokenId: '106',
        trophyStatus: 'Ready to Ship'
      });

      res = await token.setTrophyStatus(107, 2, { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'TrophyStatusChanged', {
        tokenId: '107',
        trophyStatus: 'In Transit'
      });

      res = await token.setTrophyStatus(107, 3, { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'TrophyStatusChanged', {
        tokenId: '107',
        trophyStatus: 'Received'
      });
    });
  });
}

function testSetRoyalty(tester, testConfig = true) {
  context('setRoyalty', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "bob", "updater", "royaltyManager", "royaltyReceiver"]);

    it('non-royalty-setter cannot setRoyalty', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;

      await expectRevert(
        token.setRoyalty(alice, 1000, { from:alice }),
        "MoonPhaseToken: must have royalty role to setRoyalty"
      );

      await expectRevert(
        token.setRoyalty(bob, 10, { from:updater }),
        "MoonPhaseToken: must have royalty role to setRoyalty"
      );
    });

    it('cannot setRoyalty to zero-address', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;

      await expectRevert(
        token.setRoyalty(ZERO_ADDRESS, 1000, { from:royaltyManager }),
        "MoonPhaseToken: new receiver is the zero address"
      );

      await expectRevert(
        token.setRoyalty(ZERO_ADDRESS, 10, { from:deployer }),
        "MoonPhaseToken: new receiver is the zero address"
      );
    });

    it('cannot setRoyalty to > 100%', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;

      await expectRevert(
        token.setRoyalty(alice, 10001, { from:royaltyManager }),
        "MoonPhaseToken: royalty percent BIPS must be <= 10000"
      );

      await expectRevert(
        token.setRoyalty(bob, 99999999999, { from:deployer }),
        "MoonPhaseToken: royalty percent BIPS must be <= 10000"
      );
    });

    it('setRoyalty alters royalty parameters', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;

      await token.setRoyalty(alice, 2500, { from:royaltyManager });
      assert.equal(await token.owner(), deployer);
      assert.equal(await token.royaltyReceiver(), alice);
      assert.equal(await token.royaltyPercentBips(), '2500');

      await token.setRoyalty(bob, 10000, { from:deployer });
      assert.equal(await token.owner(), deployer);
      assert.equal(await token.royaltyReceiver(), bob);
      assert.equal(await token.royaltyPercentBips(), '10000');
    });

    it('setRoyalty emits RoyaltyChanged event', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;

      let res = await token.setRoyalty(alice, 2500, { from:royaltyManager });
      await expectEvent.inTransaction(res.tx, token, 'RoyaltyChanged', {
        receiver: alice,
        percentBips: '2500'
      });

      res = await token.setRoyalty(bob, 10000, { from:deployer });
      await expectEvent.inTransaction(res.tx, token, 'RoyaltyChanged', {
        receiver: bob,
        percentBips: '10000'
      });
    });
  });
}

function testRoyaltyInfo(tester, testConfig = true) {
  context('royaltyInfo', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "bob", "minter", "updater", "royaltyManager", "royaltyReceiver"]);

    beforeEach(async () => {
      const { token, deployer, alice, bob, minter, updater, royaltyManager, royaltyReceiver } = tester;

      await token.mint(alice, 0, "", { from:minter });
      await token.mint(alice, 1, "", { from:minter });
    });

    it('royaltyInfo reports expected values', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;
      let res;

      res = await token.royaltyInfo(0, 10000);
      assert.equal(res.receiver, royaltyReceiver);
      assert.equal(res.royaltyAmount, '1500');

      res = await token.royaltyInfo(1, 30000);
      assert.equal(res.receiver, royaltyReceiver);
      assert.equal(res.royaltyAmount, '4500');

      res = await token.royaltyInfo(0, 200000);
      assert.equal(res.receiver, royaltyReceiver);
      assert.equal(res.royaltyAmount, '30000');

      res = await token.royaltyInfo(1, 100);
      assert.equal(res.receiver, royaltyReceiver);
      assert.equal(res.royaltyAmount, '15');
    });

    it('royaltyInfo reports expected values after setRoyalty', async () => {
      const { token, deployer, alice, bob, updater, royaltyManager, royaltyReceiver } = tester;
      let res;

      // set 4%
      await token.setRoyalty(alice, 400, { from:royaltyManager });
      res = await token.royaltyInfo(0, 100);
      assert.equal(res.receiver, alice);
      assert.equal(res.royaltyAmount, '4');

      res = await token.royaltyInfo(1, 20000);
      assert.equal(res.receiver, alice);
      assert.equal(res.royaltyAmount, '800');

      // set 25%
      await token.setRoyalty(bob, 2500, { from:deployer });
      res = await token.royaltyInfo(0, 100);
      assert.equal(res.receiver, bob);
      assert.equal(res.royaltyAmount, '25');

      res = await token.royaltyInfo(1, 20000);
      assert.equal(res.receiver, bob);
      assert.equal(res.royaltyAmount, '5000');
    });
  });
}

function testTransferFrom(tester, testConfig = true) {
  context('transferFrom', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "bob", "carol", "dave", "minter"]);

    it('strangers cannot transferFrom tokens', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "", { from:deployer });
      await token.mint(alice, 1, "", { from:minter });

      await token.mint(bob, 3, "", { from:deployer });
      await token.mint(bob, 4, "", { from:minter });

      await expectRevert(
        token.transferFrom(alice, dave, 0, { from:bob }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await expectRevert(
        token.transferFrom(alice, dave, 1, { from:minter }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await token.approve(minter, 3, { from:bob });
      await token.approve(alice, 4, { from:bob });

      await expectRevert(
        token.transferFrom(bob, dave, 3, { from:alice }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await expectRevert(
        token.transferFrom(bob, dave, 4, { from:deployer }),
        "ERC721: transfer caller is not owner nor approved",
      );
    });

    it('cannot transferFrom tokens from wrong address', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "uri", { from:minter });
      await token.mint(bob, 1, "uri", { from:minter });

      await token.setApprovalForAll(bob, true, { from:alice });
      await token.setApprovalForAll(bob, true, { from:carol });
      await expectRevert(
        token.transferFrom(alice, dave, 1, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );

      await expectRevert(
        token.transferFrom(bob, dave, 0, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );

      await expectRevert(
        token.transferFrom(carol, dave, 1, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );
    });

    it('transferFrom transfers tokens from wallet', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "", { from:minter });
      await token.mint(alice, 1, "", { from:minter });
      await token.mint(alice, 2, "", { from:minter });
      await token.mint(alice, 3, "", { from:minter });

      await token.mint(bob, 104, "", { from:minter });
      await token.mint(bob, 105, "", { from:minter });
      await token.mint(bob, 106, "", { from:minter });
      await token.mint(bob, 107, "", { from:minter });
      await token.mint(bob, 108, "", { from:minter });

      await token.mint(carol, 2009, "", { from:minter });
      await token.mint(carol, 2010, "", { from:minter });
      await token.mint(carol, 2011, "", { from:minter });
      await token.mint(carol, 2012, "", { from:minter });
      await token.mint(carol, 2013, "", { from:minter });
      await token.mint(carol, 2014, "", { from:minter });

      // alice: transfer own tokens to dave
      await token.transferFrom(alice, dave, 0, { from:alice });
      await token.transferFrom(alice, dave, 2, { from:alice });

      // bob: transferred by dave, who has blanket approval
      await token.setApprovalForAll(dave, true, { from:bob });
      await token.transferFrom(bob, dave, 105, { from:dave });
      await token.transferFrom(bob, dave, 107, { from:dave });

      // carol: transferred to alice by various people with specific token approval
      await token.approve(alice, 2009, { from:carol });
      await token.approve(bob, 2012, { from:carol });
      await token.transferFrom(carol, alice, 2009, { from:alice });
      await token.transferFrom(carol, alice, 2012, { from:bob });

      // new token IDs
      // alice 1, 3, 2009, 2012
      // bob 104, 106, 108
      // carol 2010, 2011, 2013, 2014
      // dave 0, 2, 105, 107

      // balances
      assert.equal(await token.totalSupply(), '15');
      assert.equal(await token.balanceOf(alice), '4');
      assert.equal(await token.balanceOf(bob), '3');
      assert.equal(await token.balanceOf(carol), '4');
      assert.equal(await token.balanceOf(dave), '4');

      // owners
      assert.equal(await token.ownerOf(0), dave);
      assert.equal(await token.ownerOf(1), alice);
      assert.equal(await token.ownerOf(2), dave);
      assert.equal(await token.ownerOf(3), alice);
      assert.equal(await token.ownerOf(104), bob);
      assert.equal(await token.ownerOf(105), dave);
      assert.equal(await token.ownerOf(106), bob);
      assert.equal(await token.ownerOf(107), dave);
      assert.equal(await token.ownerOf(108), bob);
      assert.equal(await token.ownerOf(2009), alice);
      assert.equal(await token.ownerOf(2010), carol);
      assert.equal(await token.ownerOf(2011), carol);
      assert.equal(await token.ownerOf(2012), alice);
      assert.equal(await token.ownerOf(2013), carol);
      assert.equal(await token.ownerOf(2014), carol);

      // enumeration
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '3');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 1), '1');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 2), '2009');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 3), '2012');

      assert.equal(await token.tokenOfOwnerByIndex(bob, 0), '104');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 1), '108');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 2), '106');

      assert.equal(await token.tokenOfOwnerByIndex(carol, 0), '2014');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 1), '2010');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 2), '2011');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 3), '2013');

      assert.equal(await token.tokenOfOwnerByIndex(dave, 0), '0');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 1), '2');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 2), '105');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 3), '107');
    });
  });
}

function testSafeTransferFrom(tester, testConfig = true) {
  context('safeTransferFrom', () => {
    if (testConfig) testUtilityConfig(tester, ["deployer", "alice", "bob", "carol", "dave", "minter"]);

    it('strangers cannot safeTransferFrom tokens', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "", { from:deployer });
      await token.mint(alice, 1, "", { from:minter });

      await token.mint(bob, 3, "", { from:deployer });
      await token.mint(bob, 4, "", { from:minter });

      await expectRevert(
        token.safeTransferFrom(alice, dave, 0, { from:bob }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await expectRevert(
        token.safeTransferFrom(alice, dave, 1, { from:minter }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await token.approve(minter, 3, { from:bob });
      await token.approve(alice, 4, { from:bob });

      await expectRevert(
        token.safeTransferFrom(bob, dave, 3, { from:alice }),
        "ERC721: transfer caller is not owner nor approved",
      );

      await expectRevert(
        token.safeTransferFrom(bob, dave, 4, { from:deployer }),
        "ERC721: transfer caller is not owner nor approved",
      );
    });

    it('cannot safeTransferFrom tokens from wrong address', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "uri", { from:minter });
      await token.mint(bob, 1, "uri", { from:minter });

      await token.setApprovalForAll(bob, true, { from:alice });
      await token.setApprovalForAll(bob, true, { from:carol });
      await expectRevert(
        token.safeTransferFrom(alice, dave, 1, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );

      await expectRevert(
        token.safeTransferFrom(bob, dave, 0, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );

      await expectRevert(
        token.safeTransferFrom(carol, dave, 1, { from:bob }),
        "ERC721: transfer from incorrect owner",
      );
    });

    it('safeTransferFrom transfers tokens from wallet', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      await token.mint(alice, 0, "", { from:minter });
      await token.mint(alice, 1, "", { from:minter });
      await token.mint(alice, 2, "", { from:minter });
      await token.mint(alice, 3, "", { from:minter });

      await token.mint(bob, 104, "", { from:minter });
      await token.mint(bob, 105, "", { from:minter });
      await token.mint(bob, 106, "", { from:minter });
      await token.mint(bob, 107, "", { from:minter });
      await token.mint(bob, 108, "", { from:minter });

      await token.mint(carol, 2009, "", { from:minter });
      await token.mint(carol, 2010, "", { from:minter });
      await token.mint(carol, 2011, "", { from:minter });
      await token.mint(carol, 2012, "", { from:minter });
      await token.mint(carol, 2013, "", { from:minter });
      await token.mint(carol, 2014, "", { from:minter });

      // alice: transfer own tokens to dave
      await token.safeTransferFrom(alice, dave, 0, { from:alice });
      await token.safeTransferFrom(alice, dave, 2, { from:alice });

      // bob: transferred by dave, who has blanket approval
      await token.setApprovalForAll(dave, true, { from:bob });
      await token.safeTransferFrom(bob, dave, 105, { from:dave });
      await token.safeTransferFrom(bob, dave, 107, { from:dave });

      // carol: transferred to alice by various people with specific token approval
      await token.approve(alice, 2009, { from:carol });
      await token.approve(bob, 2012, { from:carol });
      await token.safeTransferFrom(carol, alice, 2009, { from:alice });
      await token.safeTransferFrom(carol, alice, 2012, { from:bob });

      // new token IDs
      // alice 1, 3, 2009, 2012
      // bob 104, 106, 108
      // carol 2010, 2011, 2013, 2014
      // dave 0, 2, 105, 107

      // balances
      assert.equal(await token.totalSupply(), '15');
      assert.equal(await token.balanceOf(alice), '4');
      assert.equal(await token.balanceOf(bob), '3');
      assert.equal(await token.balanceOf(carol), '4');
      assert.equal(await token.balanceOf(dave), '4');

      // owners
      assert.equal(await token.ownerOf(0), dave);
      assert.equal(await token.ownerOf(1), alice);
      assert.equal(await token.ownerOf(2), dave);
      assert.equal(await token.ownerOf(3), alice);
      assert.equal(await token.ownerOf(104), bob);
      assert.equal(await token.ownerOf(105), dave);
      assert.equal(await token.ownerOf(106), bob);
      assert.equal(await token.ownerOf(107), dave);
      assert.equal(await token.ownerOf(108), bob);
      assert.equal(await token.ownerOf(2009), alice);
      assert.equal(await token.ownerOf(2010), carol);
      assert.equal(await token.ownerOf(2011), carol);
      assert.equal(await token.ownerOf(2012), alice);
      assert.equal(await token.ownerOf(2013), carol);
      assert.equal(await token.ownerOf(2014), carol);

      // enumeration
      assert.equal(await token.tokenOfOwnerByIndex(alice, 0), '3');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 1), '1');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 2), '2009');
      assert.equal(await token.tokenOfOwnerByIndex(alice, 3), '2012');

      assert.equal(await token.tokenOfOwnerByIndex(bob, 0), '104');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 1), '108');
      assert.equal(await token.tokenOfOwnerByIndex(bob, 2), '106');

      assert.equal(await token.tokenOfOwnerByIndex(carol, 0), '2014');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 1), '2010');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 2), '2011');
      assert.equal(await token.tokenOfOwnerByIndex(carol, 3), '2013');

      assert.equal(await token.tokenOfOwnerByIndex(dave, 0), '0');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 1), '2');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 2), '105');
      assert.equal(await token.tokenOfOwnerByIndex(dave, 3), '107');
    });

    it('safeTransferFrom reverts transfers to non-receiver contract', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      const receiver = await MockContract.new();

      await token.mint(alice, 0, "", { from:minter });

      await token.mint(bob, 105, "", { from:minter });

      await token.mint(carol, 2009, "", { from:minter });

      // alice: transfer own tokens to dave
      await expectRevert(
        token.safeTransferFrom(alice, receiver.address, 0, { from:alice }),
        "ERC721: transfer to non ERC721Receiver implementer"
      );

      // bob: transferred by dave, who has blanket approval
      await token.setApprovalForAll(dave, true, { from:bob });
      await expectRevert(
        token.safeTransferFrom(bob, receiver.address, 105, { from:dave }),
        "ERC721: transfer to non ERC721Receiver implementer"
      );

      // carol: transferred to alice by various people with specific token approval
      await token.approve(alice, 2009, { from:carol });
      await expectRevert(
        token.safeTransferFrom(carol, receiver.address, 2009, { from:alice }),
        "ERC721: transfer to non ERC721Receiver implementer"
      );
    });

    it('safeTransferFrom allows transfers to receiver contract', async () => {
      const { token, deployer, alice, bob, carol, dave, minter } = tester;

      const receiver = await MockERC721Receiver.new();

      await token.mint(alice, 0, "", { from:minter });

      await token.mint(bob, 105, "", { from:minter });

      await token.mint(carol, 2009, "", { from:minter });

      // alice: transfer own tokens to dave
      let res = await token.methods["safeTransferFrom(address,address,uint256,bytes)"](alice, receiver.address, 0, "0x77", { from:alice });
      await expectEvent.inTransaction(res.tx, receiver, 'ERC721Received', {
        operator: alice,
        from: alice,
        tokenId: '0',
        data: '0x77'
      });

      // bob: transferred by dave, who has blanket approval
      await token.setApprovalForAll(dave, true, { from:bob });
      res = await token.methods["safeTransferFrom(address,address,uint256,bytes)"](bob, receiver.address, 105, "0xdeadbeef", { from:dave });
      await expectEvent.inTransaction(res.tx, receiver, 'ERC721Received', {
        operator: dave,
        from: bob,
        tokenId: '105',
        data: '0xdeadbeef'
      });
    });
  });
}

async function tryTransfer(tester, { from, to, as, tokenId, permitted, approved, receiver, safe }) {
  const { token } = tester;

  // verify inputs
  if (approved == null) approved = true;
  if (permitted == null) permitted = true;
  if (safe == null) safe = false;
  if (as == null) as = from;
  assert.ok(!!from, `testing utility: "from" must be defined`);
  assert.ok(!!to, `testing utility: "to" must be  defined`);
  assert.ok(tokenId != null, `testing utility: "tokenId" must be defined`);
  assert.ok(!safe || receiver != null, `testing utility: "safe" transfers must specify "receiver" as true or false`);

  // test that "from" owns the token
  assert.equal(await token.ownerOf(tokenId), from);

  // record balances
  let balances = {}
  balances[from] = Number((await token.balanceOf(from)).toString());
  balances[to] = Number((await token.balanceOf(to)).toString());

  balances[from]--;
  balances[to]++;

  const txPromise = safe
    ? token.safeTransferFrom(from, to, tokenId, { from:as })
    : token.transferFrom(from, to, tokenId, { from:as });

  if (permitted && approved && (!safe || receiver)) {
    // success case
    await txPromise;

    assert.equal(await token.ownerOf(tokenId), to);
    assert.equal(await token.balanceOf(from), `${balances[from]}`);
    assert.equal(await token.balanceOf(to), `${balances[to]}`);
  } else if (!permitted) {
    await expectRevert(txPromise, "MoonPhaseTransferPermissionToken: Transfer not permitted");
  } else if (!approved) {
    await expectRevert(txPromise, "ERC721: transfer caller is not owner nor approved");
  } else if (!receiver) {
    await expectRevert(txPromise, "ERC721: transfer to non ERC721Receiver implementer");
  }
}

module.exports = exports = {
  // full testing operations
  testUtilityConfig,
  testRoleAdmin,
  testMint,
  testSafeMint,
  testSetTokenURI,
  testProvenanceRecord,
  testSetTrophyStatus,
  testSetRoyalty,
  testRoyaltyInfo,
  testTransferFrom,
  testSafeTransferFrom,

  // operations that assert expected outcomes; call within a test
  tryTransfer
}
