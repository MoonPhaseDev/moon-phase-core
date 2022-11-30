// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "../utils/multisig/MultiSigWallet.sol";

contract TeamAWallet is MultiSigWallet {
    string public name;

    constructor(address[] memory _owners, uint _required)
    MultiSigWallet(_owners, _required) {
        name = "A Wallet";
    }
}
