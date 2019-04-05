pragma solidity ^0.5.5;

enum Characters {
  JonSnow
  DaenerysTargaryen
  TyrionLannister
  AryaStark
  CerseiLannister
  SansaStark
  BranStark
  Varys
  JaimeLannister
  TheonGreyjoy
  YaraGreyjoy
  EuronGreyjoy
  SamwellTarly
  Gilly
  BrienneOfTarth
  DavosSeaworth
  Qyburn
  GreyWorm
  Missandei
  JorahMormont
  TheHound
  Bronn
  Melisandre
  TormundGiantsbane
  BericDondarrion
  GendryBaratheon
  MeeraReed
  TheNightKing
  OtherKnownCharacter
  NewCharacter
}

struct Prediction {
  bool[30] dies;
  uint8[30] deathEpisode;
  uint8 firstToDie;
  uint8 lastToDie;
  uint8 lastOnThrone;
}
