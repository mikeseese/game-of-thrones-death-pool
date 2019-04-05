pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./GOTDeathPoolCommon.sol";
import "./GOTDeathPoolAnswer.sol";

contract GOTDeathPool is Ownable {
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Prediction;
  using SafeERC20 for IERC20;

  address private AnswerContract;
  bool private _open;
  bool private _canClaim;
  bool private _ownerCanDisperse;
  uint256 private _stakeRequired;
  IERC20 private _token;
  mapping(address => GOTDeathPoolCommon.Prediction) predictions;
  mapping(address => uint256) pool;

  modifier predictionsOpen() {
    require(_open == true, "Predictions are closed");
    _;
  }

  modifier canClaim() {
    require(_canClaim == true, "You cannot claim your bounty yet");
    _;
  }

  modifier ownerCanDisperse() {
    require(_ownerCanDisperse == true, "You cannot disperse funds even though you're the owner");
    _;
  }

  modifier noStakers() {
    require(_token.balanceOf(address(this)) == 0, "There is some stake left in the pool");
    _;
  }

  modifier answersAvailable() {
    require(false, "Answers are not available yet"); // TODO:
    _;
  }

  modifier didStake() {
    require(pool[msg.sender] >= _stakeRequired, "You don't have any funds in the pool");
    _;
  }

  modifier didNotStake() {
    require(pool[msg.sender] == 0, "You already have any funds in the pool");
    _;
  }

  modifier hasEnoughFunds() {
    require(_token.balanceOf(msg.sender) >= _stakeRequired, "Your account doesn't have enough funds for the token");
    _;
  }

  modifier canWithdraw() {
    require(_token.balanceOf(address(this)) >= _stakeRequired, "The pool contract doesn't have enough funds to withdraw");
    _;
  }

  constructor(address answer, uint256 stakeRequired, IERC20 token, bool canDisperse)
    Ownable()
    public
  {
    AnswerContract = answer;
    _open = true;
    _canClaim = false;
    _stakeRequired = stakeRequired;
    _token = token;
    _ownerCanDisperse = canDisperse;
  }

  function setStakeAmount(uint256 amount) public onlyOwner noStakers {
    _stakeRequired = amount;
  }

  function requiredStake() public view returns(uint256) {
    return _stakeRequired;
  }

  function requiredToken() public view returns(address) {
    return address(_token);
  }

  function ownerCanDisperseFunds() public view returns(bool) {
    return _ownerCanDisperse;
  }

  function open() public onlyOwner {
    _open = true;
    _canClaim = false;
  }

  function close() public onlyOwner {
    _open = false;
    _canClaim = false;
  }

  function complete() public onlyOwner answersAvailable {
    _canClaim = true;
  }

  function predict(GOTDeathPoolCommon.Prediction memory prediction) public predictionsOpen {
    predictions[msg.sender] = prediction;
  }

  function stake() public predictionsOpen didNotStake hasEnoughFunds {
    _token.safeTransferFrom(msg.sender, address(this), _stakeRequired);
    pool[msg.sender] = _stakeRequired;
  }

  function withdraw() public predictionsOpen didStake {
    uint256 poolBalance = _token.balanceOf(address(this));
    if (poolBalance >= _stakeRequired) {
      _token.safeTransferFrom(address(this), msg.sender, _stakeRequired);
    }
    else {
      _token.safeTransferFrom(address(this), msg.sender, poolBalance);
    }
    pool[msg.sender] = 0;
  }

  function disperse(address recipient, uint256 amount) public onlyOwner canClaim ownerCanDisperse {
    uint256 poolBalance = _token.balanceOf(address(this));
    if (poolBalance >= amount) {
      _token.safeTransferFrom(address(this), recipient, amount);
    }
    else {
      _token.safeTransferFrom(address(this), msg.sender, poolBalance);
    }
  }

  function claim() public canClaim didStake {
    pool[msg.sender] = 0;
  }
}
