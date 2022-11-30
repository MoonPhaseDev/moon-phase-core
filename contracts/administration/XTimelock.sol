// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract XTimelock is TimelockController {
    string public name;

    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin)
    TimelockController(minDelay, proposers, executors, admin) {
        name = "X Timelock";
    }
}
