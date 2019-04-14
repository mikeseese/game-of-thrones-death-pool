const GOTDeathPoolTruth = artifacts.require("GOTDeathPoolTruth.sol");
const GOTDeathPool = artifacts.require("GOTDeathPool.sol");
const SimpleToken = artifacts.require("SimpleToken.sol");
const BN = require("bn.js");

module.exports = async function(deployer) {
  const tokenInstance = await SimpleToken.new();
  console.log(tokenInstance.address);
  const truthInstance = await deployer.deploy(GOTDeathPoolTruth);
  console.log(truthInstance.address);
  const poolInstance = await deployer.deploy(
    GOTDeathPool,
    truthInstance.address,
    tokenInstance.address,
    new BN(web3.utils.toWei("20", "ether")),
    true,
    true,
  );
};
