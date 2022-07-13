// delete when real info is available
const PLACEHOLDER_ADDRESS_1 = "0x0000000000000000000000000000000000001234";
const PLACEHOLDER_ADDRESS_2 = "0x0000000000000000000000000000000000002345";
const PLACEHOLDER_SHARE = 10;

const PLACEHOLDER_ADDRESSES = {
  royalty: PLACEHOLDER_ADDRESS_1,
  admin: PLACEHOLDER_ADDRESS_1,
  administration: [PLACEHOLDER_ADDRESS_1, PLACEHOLDER_ADDRESS_2]
};

const addresses = {
  company: PLACEHOLDER_ADDRESSES,
  pace: PLACEHOLDER_ADDRESSES,
  koons: PLACEHOLDER_ADDRESSES
};

const royalties = {
  company: {
    address: addresses.company.royalty,
    share: PLACEHOLDER_SHARE
  },
  pace: {
    address: addresses.pace.royalty,
    share: PLACEHOLDER_SHARE
  },
  koons: {
    address: addresses.koons.royalty,
    share: PLACEHOLDER_SHARE
  }
}

module.exports = exports = {
  // royalty address will be given royalty payments
  addresses,
  royalties
}
