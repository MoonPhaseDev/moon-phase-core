// delete when real info is available
const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000001234";

const addresses = {
  teamA: {
    royalty: "0x45093027DFb1Df4e5e464ff02147801E47AdB668",
    admin: "0xA2Ab0317217Efc7a34B6a7ae56ABfd09b21Da89B",
    administration: ["0xA2Ab0317217Efc7a34B6a7ae56ABfd09b21Da89B", "0xa7aCb39e9585bCEe5c9159FF99AaAe2c6edA22b8"]
  },
  teamB: {
    royalty: "0x44369fe5a9D4b2054dDf54FD144fbA1f818Cc4EC",
    admin: "0xF428Bf4154a9612123692Dd5968f9F408C981D99",
    administration: ["0xF428Bf4154a9612123692Dd5968f9F408C981D99", "0x523c723C591400a215C9fCb74d573e251549835F"],
    nfts: "0x67B2FdFdc341Fe9C8865421E57d8285305276Fab"
  },
  teamC: {
    royalty: PLACEHOLDER_ADDRESS, // TODO: fill with real royalty address and update migration 4_royalty_splitter.js
    admin: "0x276595505Eccec6aeCFaFF67964485b50C2F514E",
    administration: ["0x276595505Eccec6aeCFaFF67964485b50C2F514E", "0x0d8f93084ea27b2e5838572503cb6fb4da78e819"],
    management: ["0xE267E3B62d48CCbC6e8865c90698CfeC886A9769", "0x276595505Eccec6aeCFaFF67964485b50C2F514E"]
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
}

module.exports = exports = {
  // royalty address will be given royalty payments
  addresses,
  royalties
}
