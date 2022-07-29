// delete when real info is available
const PLACEHOLDER_ADDRESS_1 = "0x0000000000000000000000000000000000001234";

const addresses = {
  teamA: {
    royalty: PLACEHOLDER_ADDRESS_1,
    admin: "0x1A463A4754c2E8fC855930043c3263C049dB9f70",
    administration: ["0x1A463A4754c2E8fC855930043c3263C049dB9f70", "0x35c52ed11DD8aD760a4a8029102d80a4db37BDD0"]
  },
  teamB: {
    royalty: PLACEHOLDER_ADDRESS_1,
    admin: "0x51B656e5b88558989622800F18401aACBe0bad03",
    administration: ["0x51B656e5b88558989622800F18401aACBe0bad03", "0xaD8D5861dE3eD236cF0E2bA30619885CF9CC2C64"]
  },
  teamC: {
    royalty: "0xC85E95922ec07B19B8aD15cFdFAD97705EA3203d",
    admin: "0x75bC0F76ec4423Da8Ea6B415f98B90E2384E043e",
    administration: [
      "0x867a6B21803411c38dA19Cb826857e85E4b874bC",
      "0xC85E95922ec07B19B8aD15cFdFAD97705EA3203d"
    ],
    management: [
      "0x75bC0F76ec4423Da8Ea6B415f98B90E2384E043e",
      "0x867a6B21803411c38dA19Cb826857e85E4b874bC"
    ]
  }
};

const royalties = {
  teamA: {
    address: addresses.teamA.royalty,
    share: 500  // 50%
  },
  teamB: {
    address: addresses.teamB.royalty,
    share: 33   // 3.3%
  },
  teamC: {
    address: addresses.teamC.royalty,
    share: 467  // 46.7%
  }
};

module.exports = exports = {
  // royalty address will be given royalty payments
  addresses,
  royalties
}
