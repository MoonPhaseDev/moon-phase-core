// delete when real info is available
const PLACEHOLDER_ADDRESS_1 = "0x0000000000000000000000000000000000001234";
const PLACEHOLDER_ADDRESS_2 = "0x0000000000000000000000000000000000002345";
const PLACEHOLDER_SHARE = 10;

const addresses = {
  company: {
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
  },
  pace: {
    royalty: PLACEHOLDER_ADDRESS_1,
    admin: "0x51B656e5b88558989622800F18401aACBe0bad03",
    administration: ["0x51B656e5b88558989622800F18401aACBe0bad03", "0xaD8D5861dE3eD236cF0E2bA30619885CF9CC2C64"]
  },
  koons: {
    royalty: PLACEHOLDER_ADDRESS_1,
    admin: "0x1A463A4754c2E8fC855930043c3263C049dB9f70",
    administration: ["0x1A463A4754c2E8fC855930043c3263C049dB9f70", "0x35c52ed11DD8aD760a4a8029102d80a4db37BDD0"]
  }
};

const royalties = [
  {
    address: addresses.company.royalty,
    share: PLACEHOLDER_SHARE
  },
  {
    address: addresses.pace.royalty,
    share: PLACEHOLDER_SHARE
  },
  {
    address: addresses.koons.royalty,
    share: PLACEHOLDER_SHARE
  }
]

module.exports = exports = {
  // royalty address will be given royalty payments
  addresses,
  royalties
}