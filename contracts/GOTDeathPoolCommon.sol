pragma solidity ^0.5.7;

library GOTDeathPoolCommon {
  uint8 constant NumCharacters = 30;

  enum Character {
    JonSnow, // 0
    DaenerysTargaryen, // 1
    TyrionLannister, // 2
    AryaStark, // 3
    CerseiLannister, // 4
    SansaStark, // 5
    BranStark, // 6
    Varys, // 7
    JaimeLannister, // 8
    TheonGreyjoy, // 9
    YaraGreyjoy, // 10
    EuronGreyjoy, // 11
    SamwellTarly, // 12
    Gilly, // 13
    BrienneOfTarth, // 14
    DavosSeaworth, // 15
    Qyburn, // 16
    GreyWorm, // 17
    Missandei, // 18
    JorahMormont, // 19
    TheHound, // 20
    Bronn, // 21
    Melisandre, // 22
    TormundGiantsbane, // 23
    BericDondarrion, // 24
    GendryBaratheon, // 25
    MeeraReed, // 26
    TheNightKing, // 27
    OtherKnownCharacter, // 28
    NewCharacter // 29
  }

  struct Prediction {
    bool isValid;
    bool[NumCharacters] dies;
    uint8[NumCharacters] deathEpisode;
    Character firstToDie;
    Character firstToDieAfterFirstEpisode;
    Character lastToDie;
    Character lastOnThrone;
  }
}
