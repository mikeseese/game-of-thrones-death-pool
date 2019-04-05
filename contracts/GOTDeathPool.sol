pragma solidity ^0.5.5;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./GOTDeathPoolCommon.sol";
import "./GOTDeathPoolAnswer.sol";

contract GOTDeathPool is Ownable {
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Prediction;

  address private AnswerContract;
  mapping(address => GOTDeathPoolCommon.Prediction) predictions;

  constructor(address answer)
    Ownable()
    public
  {
    AnswerContract = answer;
  }
}
