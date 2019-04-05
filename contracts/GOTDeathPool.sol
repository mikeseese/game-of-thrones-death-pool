pragma solidity ^0.5.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./GOTDeathPoolCommon.sol";
import "./GOTDeathPoolTruth.sol";

contract GOTDeathPool is Ownable {
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Prediction;
  using SafeERC20 for IERC20;

  address private TruthContract;
  bool private _open;
  bool private _canClaim;
  bool private _ownerCanDisperse;
  uint256 private _stakeRequired;
  IERC20 private _token;
  address[] private _stakers;
  mapping(address => GOTDeathPoolCommon.Prediction) private predictions;
  mapping(address => uint256) private pool;
  mapping(address => string) private names;
  address private _firstPlace;
  address private _secondPlace;
  address private _thirdPlace;
  address private _fourthPlace;
  address private _fifthPlace;

  uint8 constant NumCharacters = 30;
  uint8 constant POINTS_FOR_CORRECT_DEATH_GUESS = 1;
  uint8 constant POINTS_FOR_INCORRECT_DEATH_GUESS = 1;
  uint8 constant POINTS_FOR_CORRECT_DEATH_EPISODE = 1;
  uint8 constant POINTS_FOR_CORRECT_FIRST_TO_DIE = 1;
  uint8 constant POINTS_FOR_CORRECT_LAST_TO_DIE = 1;
  uint8 constant POINTS_FOR_CORRECT_THRONE = 1;

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

  constructor(address truth, uint256 stakeRequired, IERC20 token, bool canDisperse)
    Ownable()
    public
  {
    TruthContract = truth;
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

  function predict(
    bool[30] memory dies,
    uint8[30] memory deathEpisode,
    uint8 firstToDie,
    uint8 lastToDie,
    uint8 lastOnThrone,
    string memory name
  )
    public
    predictionsOpen
  {
    GOTDeathPoolCommon.Prediction memory prediction;
    prediction.dies = dies;
    prediction.deathEpisode = deathEpisode;
    prediction.firstToDie = firstToDie;
    prediction.lastToDie = lastToDie;
    prediction.lastOnThrone = lastOnThrone;
    names[msg.sender] = name;
    predictions[msg.sender] = prediction;
  }

  function stake() public predictionsOpen didNotStake hasEnoughFunds {
    _token.safeTransferFrom(msg.sender, address(this), _stakeRequired);
    pool[msg.sender] = _stakeRequired;
    uint i = 0;
    for (i = 0; i < _stakers.length; i++) {
      if (_stakers[i] == msg.sender) {
        break;
      }
    }
    if (i >= _stakers.length) {
      _stakers.push(msg.sender);
    }
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

  function calculatePoints() public view returns (int16[] memory, address[] memory) {
    int16[] memory resultPoints = new int16[](_stakers.length);
    address[] memory resultAddresses = new address[](_stakers.length);

    // TODO: get truth prediction
    GOTDeathPoolCommon.Prediction memory truth;

    uint validStakers = 0;
    for (uint i = 0; i < _stakers.length; i++) {
      if (pool[_stakers[i]] >= _stakeRequired) {
        // this account is a candidate
        GOTDeathPoolCommon.Prediction storage prediction = predictions[_stakers[i]];
        int16 points = 0;

        for (uint j = 0; j < NumCharacters; j++) {
          if (prediction.dies[j] == truth.dies[j]) {
            points = points + POINTS_FOR_CORRECT_DEATH_GUESS;

            if (truth.dies[j] == true && prediction.deathEpisode[j] == truth.deathEpisode[j]) {
              points = points + POINTS_FOR_CORRECT_DEATH_EPISODE;
            }
          }
          else {
            points = points - POINTS_FOR_INCORRECT_DEATH_GUESS;
          }
        }

        if (prediction.firstToDie == truth.firstToDie) {
          points = points + POINTS_FOR_CORRECT_FIRST_TO_DIE;
        }

        if (prediction.lastToDie == truth.lastToDie) {
          points = points + POINTS_FOR_CORRECT_LAST_TO_DIE;
        }

        if (prediction.lastOnThrone == truth.lastOnThrone) {
          points = points + POINTS_FOR_CORRECT_THRONE;
        }

        resultPoints[validStakers] = points;
        resultAddresses[validStakers] = _stakers[i];
        validStakers++;
      }
    }

    return (resultPoints, resultAddresses);
  }

  function complete() public onlyOwner answersAvailable {
    _canClaim = true;
    int16[] memory resultPoints;
    address[] memory resultAddresses;

    address firstPlace;
    address secondPlace;
    address thirdPlace;
    address fourthPlace;
    address fifthPlace;

    int16 firstPlacePoints = 0;
    int16 secondPlacePoints = 0;
    int16 thirdPlacePoints = 0;
    int16 fourthPlacePoints = 0;
    int16 fifthPlacePoints = 0;

    (resultPoints, resultAddresses) = calculatePoints();

    for (uint i = 0; i < resultPoints.length; i++) {
      if (resultPoints[i] > fourthPlacePoints) {
        fifthPlacePoints = fourthPlacePoints;

        fifthPlace = fourthPlace;
      }
      if (resultPoints[i] > thirdPlacePoints) {
        fourthPlacePoints = thirdPlacePoints;

        fourthPlace = thirdPlace;
      }
      if (resultPoints[i] > secondPlacePoints) {
        thirdPlacePoints = secondPlacePoints;

        thirdPlace = secondPlace;
      }
      if (resultPoints[i] > firstPlacePoints) {
        secondPlacePoints = firstPlacePoints;

        secondPlace = firstPlace;
      }

      if (resultPoints[i] > firstPlacePoints) {
        firstPlacePoints = resultPoints[i];

        firstPlace = resultAddresses[i];
      }
      else if (resultPoints[i] > secondPlacePoints) {
        secondPlacePoints = resultPoints[i];

        secondPlace = resultAddresses[i];
      }
      else if (resultPoints[i] > thirdPlacePoints) {
        thirdPlacePoints = resultPoints[i];

        thirdPlace = resultAddresses[i];
      }
      else if (resultPoints[i] > fourthPlacePoints) {
        fourthPlacePoints = resultPoints[i];

        fourthPlace = resultAddresses[i];
      }
      else if (resultPoints[i] > fifthPlacePoints) {
        fifthPlacePoints = resultPoints[i];

        fifthPlace = resultAddresses[i];
      }
    }

    _firstPlace = firstPlace;
    _secondPlace = secondPlace;
    _thirdPlace = thirdPlace;
    _fourthPlace = fourthPlace;
    _fifthPlace = fifthPlace;
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
