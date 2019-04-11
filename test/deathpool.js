const GOTDeathPool = artifacts.require("GOTDeathPool.sol");
const GOTDeathPoolTruth = artifacts.require("GOTDeathPoolTruth.sol");
const TestERC = artifacts.require("SimpleToken.sol");
const assert = require("assert");
const BN = require("bn.js");

const predictions = require("./predictions");

const DaiContractAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

contract("GOTDeathPool", accounts => {
  let truthInstance;
  let poolInstance;
  let tokenInstance;

  before(async () => {
    tokenInstance = await TestERC.new({
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
          from: accounts[0],
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
      assert.equal((await tokenInstance.balanceOf.call(accounts[1])).toString(), new BN(web3.utils.toWei("50", "ether")).subn(1).toString());
      await tokenInstance.transfer(accounts[0], new BN(web3.utils.toWei("50", "ether")).subn(1), { from: accounts[1] });
      assert.equal((await tokenInstance.balanceOf.call(accounts[1])).toString(), "0");
      return;
    }
    assert.fail("succeeded to stake without funds");
  });

  it("gives 1-9 accounts funds", async () => {
    for (let i = 1; i < 10; i++) {
      await tokenInstance.transfer(accounts[i], new BN(web3.utils.toWei("50", "ether")));
      assert.equal((await tokenInstance.balanceOf.call(accounts[i])).toString(), new BN(web3.utils.toWei("50", "ether")).toString());
    }
  });

  it("fails to withdraw when i havent staked", async () => {
    try {
      await poolInstance.withdraw({
        from: accounts[1],
      });
    }
    catch (err) {
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
    }
  });

  it("withdraws 1th stake", async () => {
    await poolInstance.withdraw({
      from: accounts[1],
    });
  });

  it("makes 1th stake", async () => {
    await tokenInstance.increaseAllowance(poolInstance.address, new BN(web3.utils.toWei("50", "ether")), {
      from: accounts[1]
    });
    await poolInstance.stake({
      from: accounts[1],
    });
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

  it("logs episode", async () => {
    const throneOccupants = [
      4,
      4,
      7,
      2,
      0,
      1
    ];

    for (let episode = 1; episode <= 6; episode++) {
      const deathState = predictions[0].deathEpisode.map((deathEpisode) => {
        return deathEpisode > 0 && deathEpisode <= episode;
      });

      await truthInstance.logEpisode(
        deathState,
        episode,
        throneOccupants[episode -1],
        {
          from: accounts[0],
        },
      );
    }
  });

  // complete

  // disperse

  // claim
});
