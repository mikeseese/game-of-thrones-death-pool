pragma solidity ^0.5.5;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./GOTDeathPoolCommon.sol";

/*
 * This contract will be deployed at least once and can be refered
 * by other instances of GOTDeathPool so the owner of every pool
 * doesn't each have to mark truth (they can if they want though).
 *
 * Ideally, the owner of this contract would mark deaths/brought back
 * to life at the end of every episode so users can track their current
 * standing on the dapp. I'm thinking a single function that modifies the
 * one truth prediction state variable. the function would provide an array
 * of death state and the episode number
 */
contract GOTDeathPoolTruth is Ownable {
  constructor()
    Ownable()
    public
  {
  }
}
