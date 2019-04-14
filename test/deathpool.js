const GOTDeathPool = artifacts.require("GOTDeathPool.sol");
const GOTDeathPoolTruth = artifacts.require("GOTDeathPoolTruth.sol");
const SimpleToken = artifacts.require("SimpleToken.sol");
const assert = require("assert");
const BN = require("bn.js");

const predictions = require("./predictions");

const DaiContractAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

contract("GOTDeathPool", accounts => {
  let truthInstance;
  let poolInstance;
  let tokenInstance;

  const assertTokenBalance = async (address, amount, subtraction = 0) => {
    assert.equal((await tokenInstance.balanceOf.call(address)).toString(), new BN(web3.utils.toWei(`${amount}`, "ether")).subn(subtraction).toString());
  }

  const assertTokenBalanceGte = async (address, amount, subtraction = 0) => {
    assert((await tokenInstance.balanceOf.call(address)).gte(new BN(web3.utils.toWei(`${amount}`, "ether")).subn(subtraction)));
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
      tokenInstance.address,
      new BN(web3.utils.toWei("50", "ether")),
      true,
      false,
      {
        from: accounts[0],
      }
    );
  });

  it("makes 9 predictions", async () => {
    for (let i = 1; i < 10; i++) {
      await poolInstance.predict(
        predictions[i].dies,
        predictions[i].deathEpisode,
        predictions[i].firstToDie,
        predictions[i].lastToDie,
        predictions[i].lastOnThrone,
        predictions[i].name,
        {
          from: accounts[i],
        }
      );
    }
  });

  it("fails to make stake without funds", async () => {
    await tokenInstance.increaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
      from: accounts[1]
    });
    try {
      await poolInstance.stake({
        from: accounts[1],
      });
    }
    catch (err) {
      await tokenInstance.decreaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
        from: accounts[1]
      });
      return;
    }
    assert.fail("succeeded to stake without funds");
  });

  it("gives account 1 just barely not enough funds", async () => {
    await tokenInstance.transfer(accounts[1], new BN(web3.utils.toWei("50", "ether")).subn(1));
  });

  it("fails to make stake without enough funds", async () => {
    try {
      await poolInstance.stake({
        from: accounts[1],
      });
    }
    catch (err) {
      await assertTokenBalance(accounts[1], 50, 1);
      await tokenInstance.transfer(accounts[0], new BN(web3.utils.toWei("50", "ether")).subn(1), { from: accounts[1] });
      await assertTokenBalance(accounts[1], 0);
      return;
    }
    assert.fail("succeeded to stake without funds");
  });

  it("gives 1-9 accounts funds", async () => {
    for (let i = 1; i < 10; i++) {
      await tokenInstance.transfer(accounts[i], new BN(web3.utils.toWei("50", "ether")));
      await assertTokenBalance(accounts[i], 50);
    }
  });

  it("fails to withdraw when i havent staked", async () => {
    try {
      await poolInstance.withdraw({
        from: accounts[1],
      });
    }
    catch (err) {
      await assertTokenBalance(accounts[1], 50);
      return;
    }
    assert.fail("succeeded to withdraw without stake");
  });

  it("makes 9 stakes", async () => {
    for (let i = 1; i < 10; i++) {
      await tokenInstance.increaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
        from: accounts[i]
      });
      await poolInstance.stake({
        from: accounts[i],
      });
      await assertTokenBalance(accounts[i], 0);
    }
  });

  it("withdraws 1th stake", async () => {
    await poolInstance.withdraw({
      from: accounts[1],
    });
    await assertTokenBalance(accounts[1], 50);
  });

  it("makes 1th stake", async () => {
    await tokenInstance.increaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
      from: accounts[1]
    });
    await poolInstance.stake({
      from: accounts[1],
    });
    await assertTokenBalance(accounts[1], 0);
  });

  it("updates 1th prediction", async () => {
    await poolInstance.predict(
      predictions[1].dies,
      predictions[1].deathEpisode,
      predictions[1].firstToDie,
      predictions[1].lastToDie,
      predictions[1].lastOnThrone,
      predictions[1].name,
      {
        from: accounts[1],
      }
    );
  });

  it("fails to close as a non-owner", async () => {
    try {
      await poolInstance.close({
        from: accounts[1],
      })
    }
    catch (err) {
      // success
      return;
    }
    assert.fail("Closed from a non-owner");
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

  it("fails to withdraw after rounds closed", async () => {
    try {
      await poolInstance.withdraw({
        from: accounts[1],
      });
    }
    catch (err) {
      await assertTokenBalance(accounts[1], 0);
      return;
    }
    assert.fail("succeeded to withdraw without stake");
  });

  it("fails to update 1th prediction after rounds closed", async () => {
    try {
      await poolInstance.predict(
        predictions[1].dies,
        predictions[1].deathEpisode,
        predictions[1].firstToDie,
        predictions[1].lastToDie,
        predictions[1].lastOnThrone,
        predictions[1].name,
        {
          from: accounts[1],
        }
      );
    }
    catch (err) {
      return;
    }
    assert.fail("updated prediction after rounds closed");
  });

  it("executes episodes 1-5, can calculate ongoing leaderboards", async () => {
    const throneOccupants = [
      4,
      4,
      7,
      2,
      0,
      1
    ];

    for (let episode = 1; episode <= 5; episode++) {
      const deathState = predictions[0].deathEpisode.map((deathEpisode) => {
        return deathEpisode > 0 && deathEpisode <= episode;
      });

      await truthInstance.logEpisode(
        deathState,
        episode,
        throneOccupants[episode - 1],
        {
          from: accounts[0],
        },
      );

      await displayLeaderboard();
    }
  });

  it("fails to complete pool before truth is complete", async () => {
    try {
      await poolInstance.complete({
        from: accounts[0],
      });
    }
    catch (err) {
      assert.equal(await truthInstance.TruthComplete.call(), false);
      return;
    }
    assert.fail("succeeded to complete even though truth should be incomplete");
  });

  it("executes episode 6, can calculate ongoing leaderboards", async () => {
    const throneOccupants = [
      4,
      4,
      7,
      2,
      0,
      1
    ];

    const deathState = predictions[0].deathEpisode.map((deathEpisode) => {
      return deathEpisode > 0 && deathEpisode <= 6;
    });

    await truthInstance.logEpisode(
      deathState,
      6,
      throneOccupants[6 - 1],
      {
        from: accounts[0],
      },
    );

    await displayLeaderboard();
  });

  it("fails to disperse money before complete", async () => {
    try {
      await poolInstance.disperse(accounts[1], new BN(web3.utils.toWei("1", "ether")), {
        from: accounts[0],
      });
    }
    catch (err) {
      await assertTokenBalance(accounts[1], 0);
      return;
    }
    assert.fail("succeeded to disperse funds even though pool is not complete yet");
  });

  it("completes truth", async () => {
    await truthInstance.complete();
  });

  it("incompletes truth", async () => {
    await truthInstance.incomplete();
  });

  it("fails to complete pool before truth is complete", async () => {
    try {
      await poolInstance.complete({
        from: accounts[0],
      });
    }
    catch (err) {
      assert.equal(await truthInstance.TruthComplete.call(), false);
      return;
    }
    assert.fail("succeeded to complete even though truth should be incomplete");
  });

  it("completes truth", async () => {
    await truthInstance.complete();
  });

  it("fails to claim before complete", async () => {
    const leaderboard = await sortedLeaderboard();
    try {
      await poolInstance.claim({
        from: leaderboard[0].address,
      });
    }
    catch (err) {
      await assertTokenBalance(leaderboard[0].address, 0);
      return;
    }
    assert.fail("claimed before completing");
  });

  it("completes pool", async () => {
    await poolInstance.complete();
  });

  it("sets pool to be claimable", async () => {
    await poolInstance.allowClaiming();
  });

  it("fails to claim while not placing", async () => {
    const leaderboard = await sortedLeaderboard();
    try {
      await poolInstance.claim({
        from: leaderboard[5].address,
      });
    }
    catch (err) {
      await assertTokenBalance(leaderboard[5].address, 0);
      return;
    }
    assert.fail("claimed when not placing");
  });

  it("3rd place claims", async () => {
    const awards = [
      229,
      117,
      58,
      31,
      13
    ];

    const leaderboard = await sortedLeaderboard();

    await poolInstance.claim({
      from: leaderboard[2].address,
    });
    await assertTokenBalanceGte(leaderboard[2].address, awards[2]);
  });
  
  it("disperse some funds to 1st account", async() => {
    const balanceBefore = await tokenInstance.balanceOf.call(accounts[1]);
    await poolInstance.disperse(accounts[1], web3.utils.toWei("1", "ether"));
    const balanceAfter = await tokenInstance.balanceOf.call(accounts[1]);
    assert.equal(balanceAfter.toString(), balanceBefore.add(new BN(web3.utils.toWei("1", "ether"))).toString());
  });

  it("3rd place fails to claim a second time", async () => {
    const leaderboard = await sortedLeaderboard();

    const balanceBefore = await tokenInstance.balanceOf.call(leaderboard[2].address);
    try {
      await poolInstance.claim({
        from: leaderboard[2].address,
      });
    }
    catch (err) {
      const balanceAfter = await tokenInstance.balanceOf.call(leaderboard[2].address);
      assert.equal(balanceAfter.toString(), balanceBefore.toString());
      return;
    }
    assert.fail("3rd place succeeded to claim a second time");
  });

  it("1st and 2nd places claim", async () => {
    const awards = [
      229,
      117,
      58,
      31,
      13
    ];

    const leaderboard = await sortedLeaderboard();

    for (let i = 0; i < 2; i++) {
      await poolInstance.claim({
        from: leaderboard[i].address,
      });
      await assertTokenBalanceGte(leaderboard[i].address, awards[i]);
    }
  });
});
