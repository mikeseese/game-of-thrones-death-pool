pragma solidity ^0.5.5;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "Common.sol";

contract GOTDeathPoolAnswer is Ownable {
  address private AnswerContract;

  constructor()
    Ownable()
    public
  {
  }
}
