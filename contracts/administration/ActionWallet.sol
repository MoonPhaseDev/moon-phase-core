pragma solidity 0.8.10;

import "../utils/multisig/MultiSigWallet.sol";

contract ActionWallet is MultiSigWallet {
    string public name;

    constructor(address[] memory _owners, uint _required)
    MultiSigWallet(_owners, _required) {
        name = "Action Wallet";
    }
}
