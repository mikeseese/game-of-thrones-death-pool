const GOTDeathPool = artifacts.require("./GOTDeathPool.sol");

contract("GOTDeathPool", accounts => {
  it("should deploy", async () => {
    const instance = await GOTDeathPool.deployed();
  });
});
