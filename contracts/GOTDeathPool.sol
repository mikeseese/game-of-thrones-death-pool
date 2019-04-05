pragma solidity ^0.5.5;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "Common.sol";
import "GOTDeathPoolAnswer";

contract GOTDeathPool is Ownable {
  address private AnswerContract;

  constructor(address answer)
    Ownable()
    public
  {
    AnswerContract = answer;
  }
} 
