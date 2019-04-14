pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

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
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Prediction;
  using GOTDeathPoolCommon for GOTDeathPoolCommon.Character;

  uint8 constant NumCharacters = 30;

  GOTDeathPoolCommon.Prediction public TruthState;
  bool public TruthComplete;

  constructor()
    Ownable()
    public
  {
    TruthState.lastOnThrone = GOTDeathPoolCommon.Character.CerseiLannister;
    TruthState.firstToDie = GOTDeathPoolCommon.Character.NewCharacter;
    TruthState.lastToDie = GOTDeathPoolCommon.Character.NewCharacter;
    TruthComplete = false;
  }

  function GetTruthState() public view returns (GOTDeathPoolCommon.Prediction memory) {
    return TruthState;
  }

  function logFirstToDie(GOTDeathPoolCommon.Character character) public onlyOwner {
    TruthState.firstToDie = character;
  }

  function logFirstToDieAfterFirstEpisode(GOTDeathPoolCommon.Character character) public onlyOwner {
    TruthState.firstToDieAfterFirstEpisode = character;
  }

  function logLastToDie(GOTDeathPoolCommon.Character character) public onlyOwner {
    TruthState.lastToDie = character;
  }

  function logEpisode(bool[NumCharacters] memory deathState, uint8 episodeNumber, GOTDeathPoolCommon.Character throneOwner) public onlyOwner {
    for (uint8 i = 0; i < NumCharacters; i++) {
      if (deathState[i] == true) {
        // character dead
        if (TruthState.dies[i] == false) {
          // character died this episode
          TruthState.dies[i] = true;
          TruthState.deathEpisode[i] = episodeNumber;
        }
      }
      else {
        // character is alive
        if (TruthState.dies[i] == true) {
          // character came back to life this episode
          TruthState.dies[i] = false;
          // wont update deathEpisode in case we want to give kudos anyway for guessing the original death
        }
      }
    }

    if (TruthState.lastOnThrone != throneOwner) {
      TruthState.lastOnThrone = throneOwner;
    }
  }

  function incomplete() public onlyOwner {
    TruthComplete = false;
  }

  function complete() public onlyOwner {
    TruthComplete = true;
  }
}
