var GOTDeathPool = artifacts.require("./GOTDeathPool.sol");

module.exports = function(deployer) {
  deployer.deploy(GOTDeathPool);
};
