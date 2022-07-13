pragma solidity 0.8.10;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract RoyaltyTimelock is TimelockController {
  string public name;

  constructor(uint256 minDelay, address[] memory proposers, address[] memory executors)
  TimelockController(minDelay, proposers, executors) {
    name = "Royalty Timelock";
  }
}
