pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./GOTDeathPoolCommon.sol";
import "./GOTDeathPoolTruth.sol";

contract GOTDeathPool is Ownable {
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Prediction;
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Character;
  using SafeERC20 for IERC20;

  GOTDeathPoolTruth public TruthContract;
  bool public _open;
  bool public _canDisperse;
  bool public _canClaim;
  bool private _ownerCanDisperse;
  uint256 private _stakeRequired;
  bool public _skipsFirstEpisode;
  IERC20 private _token;
  address[] private _stakers;
  mapping(address => GOTDeathPoolCommon.Prediction) public predictions;
  mapping(address => uint256) private pool;
  mapping(address => string) public names;
  mapping(address => bool) private claimed;
  address public _firstPlace;
  address public _secondPlace;
  address public _thirdPlace;
  address public _fourthPlace;
  address public _fifthPlace;
  uint256 public _completedBalance;

  uint8 constant NumCharacters = 30;
  uint8 constant POINTS_FOR_CORRECT_DEATH_GUESS = 1;
  uint8 constant POINTS_FOR_INCORRECT_DEATH_GUESS = 1;
  uint8 constant POINTS_FOR_CORRECT_DEATH_EPISODE = 1;
  uint8 constant POINTS_FOR_CORRECT_FIRST_TO_DIE = 1;
  uint8 constant POINTS_FOR_CORRECT_LAST_TO_DIE = 1;
  uint8 constant POINTS_FOR_CORRECT_THRONE = 1;

  uint8 constant FIRST_PLACE_PRIZE_PERCENT = 51;
  uint8 constant SECOND_PLACE_PRIZE_PERCENT = 26;
  uint8 constant THIRD_PLACE_PRIZE_PERCENT = 13;
  uint8 constant FOURTH_PLACE_PRIZE_PERCENT = 7;
  uint8 constant FIFTH_PLACE_PRIZE_PERCENT = 3;

  modifier predictionsOpen() {
    require(_open == true, "Predictions are closed");
    _;
  }

  modifier canClaim() {
    require(_canClaim == true, "You cannot claim your bounty yet");
    _;
  }

  modifier canDisperse() {
    require(_canDisperse == true, "You cannot disperse awards yet. call complete()");
    _;
  }

  modifier ownerCanDisperse() {
    require(_ownerCanDisperse == true, "You cannot disperse funds even though you're the owner");
    _;
  }

  modifier isIncomplete() {
    require(_canClaim == false, "The pool has already been completed");
    _;
  }

  modifier noStakers() {
    require(_token.balanceOf(address(this)) == 0, "There is some stake left in the pool");
    _;
  }

  modifier answersAvailable() {
    require(TruthContract.TruthComplete() == true, "Answers are not available yet");
    _;
  }

  modifier didStake() {
    require(pool[msg.sender] >= _stakeRequired, "You don't have any funds in the pool");
    _;
  }

  modifier didNotClaim() {
    require(claimed[msg.sender] == false, "You already claimed!");
    _;
  }

  modifier didNotStake() {
    require(pool[msg.sender] == 0, "You already have funds in the pool");
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

  constructor(
    GOTDeathPoolTruth truth,
    IERC20 token,
    uint256 stakeRequired,
    bool canDisperse,
    bool skipsFirstEpisode
  )
    Ownable()
    public
  {
    TruthContract = truth;
    _open = true;
    _canClaim = false;
    _canDisperse = false;
    _token = token;
    _stakeRequired = stakeRequired;
    _ownerCanDisperse = canDisperse;
    _skipsFirstEpisode = skipsFirstEpisode;
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

  function getName(address a) public view returns(string memory) {
    return names[a];
  }

  function tokenAddress() public view returns(address) {
    return address(_token);
  }

  function havePredicted() public view returns(bool) {
    return predictions[msg.sender].isValid;
  }

  function haveStaked() public view returns(bool) {
    return pool[msg.sender] > 0;
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
    GOTDeathPoolCommon.Character firstToDie,
    GOTDeathPoolCommon.Character lastToDie,
    GOTDeathPoolCommon.Character lastOnThrone,
    string memory name
  )
    public
    predictionsOpen
  {
    GOTDeathPoolCommon.Prediction memory prediction;
    prediction.isValid = true;
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
      _token.safeTransfer(msg.sender, _stakeRequired);
    }
    else {
      _token.safeTransfer(msg.sender, poolBalance);
    }
    pool[msg.sender] = 0;
  }

  function calculatePoints() public view returns (int16[] memory, address[] memory) {
    int16[] memory resultPoints = new int16[](_stakers.length);
    address[] memory resultAddresses = new address[](_stakers.length);

    GOTDeathPoolCommon.Prediction memory truth = TruthContract.GetTruthState();

    uint validStakers = 0;
    for (uint i = 0; i < _stakers.length; i++) {
      if (pool[_stakers[i]] >= _stakeRequired) {
        // this account is a candidate
        GOTDeathPoolCommon.Prediction storage prediction = predictions[_stakers[i]];
        int16 points = 0;

        for (uint j = 0; j < NumCharacters - 2; j++) {
          if (
            _skipsFirstEpisode == true &&
            truth.dies[j] == true &&
            truth.deathEpisode[j] == 1
          ) {
            continue;
          }

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

        if (_skipsFirstEpisode == true) {
          // if we skip the first episode, just use first to die after episode 1
          if (prediction.firstToDie == truth.firstToDieAfterFirstEpisode) {
            points = points + POINTS_FOR_CORRECT_FIRST_TO_DIE;
          }
        }
        else {
          // if we don't skip the first episode, just use first to die
          if (prediction.firstToDie == truth.firstToDie) {
            points = points + POINTS_FOR_CORRECT_FIRST_TO_DIE;
          }
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

  function complete() public onlyOwner answersAvailable isIncomplete {
    _canDisperse = true;
    int16[] memory resultPoints;
    address[] memory resultAddresses;

    address firstPlace;
    address secondPlace;
    address thirdPlace;
    address fourthPlace;
    address fifthPlace;

    int16 firstPlacePoints = -1000;
    int16 secondPlacePoints = -1000;
    int16 thirdPlacePoints = -1000;
    int16 fourthPlacePoints = -1000;
    int16 fifthPlacePoints = -1000;

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

    _completedBalance = _token.balanceOf(address(this));
  }

  function disperse(address recipient, uint256 amount) public onlyOwner canDisperse ownerCanDisperse {
    uint256 poolBalance = _token.balanceOf(address(this));
    if (poolBalance >= amount) {
      _token.safeTransfer(recipient, amount);
    }
    else {
      _token.safeTransfer(recipient, poolBalance);
    }
  }

  function allowClaiming() public onlyOwner answersAvailable isIncomplete {
    _canClaim = true;
  }

  function claim() public canClaim didStake didNotClaim {
    uint256 awardBalance = 0;
    uint256 balancePercent = _completedBalance / 100;

    if (msg.sender == _firstPlace) {
      awardBalance = balancePercent * FIRST_PLACE_PRIZE_PERCENT;
    }
    else if (msg.sender == _secondPlace) {
      awardBalance = balancePercent * SECOND_PLACE_PRIZE_PERCENT;
    }
    else if (msg.sender == _thirdPlace) {
      awardBalance = balancePercent * THIRD_PLACE_PRIZE_PERCENT;
    }
    else if (msg.sender == _fourthPlace) {
      awardBalance = balancePercent * FOURTH_PLACE_PRIZE_PERCENT;
    }
    else if (msg.sender == _fifthPlace) {
      awardBalance = balancePercent * FIFTH_PLACE_PRIZE_PERCENT;
    }

    require(awardBalance > 0, "You didn't place");

    uint256 poolBalance = _token.balanceOf(address(this));

    if (poolBalance >= awardBalance) {
      _token.safeTransfer(msg.sender, awardBalance);
    }
    else {
      _token.safeTransfer(msg.sender, poolBalance);
    }

    claimed[msg.sender] = true;
  }
}
