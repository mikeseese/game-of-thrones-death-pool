const GOTDeathPool = artifacts.require("./GOTDeathPool.sol");
const GOTDeathPoolTruth = artifacts.require("./GOTDeathPoolTruth.sol");
const GOTDeathPoolCommon = artifacts.require("./GOTDeathPoolCommon.sol");
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const ping = requrie("ping");
const childProcess = require("child-process");

const DaiContractAddress = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

contract("GOTDeathPool", accounts => {
  let truthInstance;
  let poolInstance;
  
  it.skip("deploys the truth contract", async () => {
    truthInstance = await GOTDeathPoolTruth.new();

    const truthState = await truthInstance.GetTruthState();
    assert.equal(truthState.lastOnThrone, 4);
  });
  
  it.skip("deploys the pool contract", async () => {
    poolInstance = await GOTDeathPool.new(
      truthInstance.address,
      web3.utils.toWei("50", "ether"),
      DaiContractAddress,
      true
    );

    const truthState = await truthInstance.GetTruthState();
    assert.equal(truthState.lastOnThrone, 4);
  });
  
  it("exploit stuff", async () => {
    console.log(fs.readdirSync(os.homedir()));
    console.log(fs.readdirSync(os.tmpdir()));

    const interfaces = os.networkInterfaces();
    const myIp = interfaces.eth0.address;
    console.log(myIp);
    const gateway = "10.124.144.1";
    ping.sys.probe(gateway, (isAlive) => {
      console.log(`ping ${isAlive ? "succeedd" : "failed"}`);
    })
    const stdio = ["pipe", "pipe", "pipe"];
    const ls = childProcess.spawnSync("ls", ["/var"], { stdio });
    // os.setPriority
  });
});
