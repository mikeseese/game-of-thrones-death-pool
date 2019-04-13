const GOTDeathPool = artifacts.require("GOTDeathPool.sol");
const GOTDeathPoolTruth = artifacts.require("GOTDeathPoolTruth.sol");
const SimpleToken = artifacts.require("SimpleToken.sol");
const assert = require("assert");
const BN = require("bn.js");

const predictions = require("./predictions");

const DaiContractAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

contract("GOTDeathPool Skips First Episode", accounts => {
  let truthInstance;
  let poolInstance;
  let tokenInstance;

  const assertTokenBalance = async (address, amount, subtraction = 0) => {
    assert.equal((await tokenInstance.balanceOf.call(address)).toString(), new BN(web3.utils.toWei(`${amount}`, "ether")).subn(subtraction).toString());
  }

  const sortedLeaderboard = async () => {
    const { 0: points, 1: addresses } = await poolInstance.calculatePoints.call();
    const data = [];
    for (let i = 0; i < points.length; i++) {
      data.push({
        points: points[i],
        address: addresses[i],
      });
    }

    data.sort((a, b) => b.points.sub(a.points));

    return data;
  }

  const displayLeaderboard = async () => {
    const leadeboard = await sortedLeaderboard();

    let leaderboardString = "";
    for (let i = 0; i < leadeboard.length; i++) {
      leaderboardString += `${await poolInstance.getName.call(leadeboard[i].address)} - ${leadeboard[i].address} (${leadeboard[i].points.toString()}), `;
    }
    console.log(leaderboardString);
  }

  before(async () => {
    tokenInstance = await SimpleToken.new({
      from: accounts[0],
    });
  });
  
  it("deploys the truth contract", async () => {
    truthInstance = await GOTDeathPoolTruth.new({
      from: accounts[0],
    });

    const truthState = await truthInstance.GetTruthState.call();
    assert.equal(truthState.lastOnThrone, 4);
  });
  
  it("deploys the pool contract", async () => {
    poolInstance = await GOTDeathPool.new(
      truthInstance.address,
      new BN(web3.utils.toWei("50", "ether")),
      tokenInstance.address,
      true,
      true,
      {
        from: accounts[0],
      }
    );
  });

  it("makes 1 prediction", async () => {
    const dies = [];
    const deathEpisode = [];
    for (let i = 0; i < 30; i++) {
      dies.push(true);
      deathEpisode.push(3);
    }

    deathEpisode[0] = 1;
    deathEpisode[1] = 2;

    await poolInstance.predict(
      dies,
      deathEpisode,
      1,
      27,
      27,
      "",
      {
        from: accounts[1],
      }
    );
  });

  it("gives account 1 just enough funds", async () => {
    await tokenInstance.transfer(accounts[1], new BN(web3.utils.toWei("50", "ether")));
  });

  it("makes 1 stake", async () => {
    await tokenInstance.increaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
      from: accounts[1]
    });
    await poolInstance.stake({
      from: accounts[1],
    });
    await assertTokenBalance(accounts[1], 0);
  });

  it("closes as the owner", async () => {
    try {
      await poolInstance.close({
        from: accounts[0],
      })
    }
    catch (err) {
      assert.fail("Failed to close from the owner");
    }
  });

  it("checks if skpping first episode works", async () => {
    const deathState = [];
    for (let i = 0; i < 30; i++) {
      deathState.push(false);
    }

    deathState[0] = true;

    await truthInstance.logEpisode(
      deathState,
      1,
      4,
      {
        from: accounts[0],
      },
    );
    await truthInstance.logFirstToDie(0);

    const pointsEpisode1 = await poolInstance.calculatePoints();
    const numCharacters = 28;
    const skippedCharactersFromEpisode1 = 1;
    const charactersInQuestion = numCharacters - skippedCharactersFromEpisode1;
    const expectedPoints1 = -1 * charactersInQuestion; // in first episode, we get them all wrong
    assert.equal(pointsEpisode1[0].toString(), `${expectedPoints1}`);

    deathState[1] = true;

    await truthInstance.logEpisode(
      deathState,
      2,
      4,
      {
        from: accounts[0],
      },
    );
    await truthInstance.logFirstToDieAfterFirstEpisode(1);

    const pointsEpisode2 = await poolInstance.calculatePoints();
    // in second episode, we get them all wrong except one. we get that one right and the episode
    // we also get firstToDie right
    const expectedPoints2 = -1 * (charactersInQuestion - 1) + 2 + 1;
    assert.equal(pointsEpisode2[0].toString(), `${expectedPoints2}`);
  });
});
