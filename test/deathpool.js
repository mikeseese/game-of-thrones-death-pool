const GOTDeathPool = artifacts.require("./GOTDeathPool.sol");
const GOTDeathPoolTruth = artifacts.require("./GOTDeathPoolTruth.sol");
const GOTDeathPoolCommon = artifacts.require("./GOTDeathPoolCommon.sol");
const assert = require("assert");

const DaiContractAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

contract("GOTDeathPool", accounts => {
  let truthInstance;
  let poolInstance;
  
  it("deploys the truth contract", async () => {
    truthInstance = await GOTDeathPoolTruth.new();

    const truthState = await truthInstance.GetTruthState();
    assert.equal(truthState.lastOnThrone, 4);
  });
  
  it("deploys the pool contract", async () => {
    poolInstance = await GOTDeathPool.new(
      truthInstance.address,
      web3.utils.toWei("50", "ether"),
      DaiContractAddress,
      true
    );

    const truthState = await truthInstance.GetTruthState();
    assert.equal(truthState.lastOnThrone, 4);
  });
  
  it("should deploy", async () => {
    //const instance = await GOTDeathPool.new();
  });
});
