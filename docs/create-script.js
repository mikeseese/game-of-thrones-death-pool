
let haveWeb3 = false;

let artifact;
let erc20;
let contract;

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3js = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  erc20 = web3js.eth.contract(erc20abi);

  $.getJSON("GOTDeathPool.json?v=2", (data) => {
    artifact = data;
    contract = web3js.eth.contract(artifact.abi);
  });

  // Now you can start your app & access web3 freely:
  haveWeb3 = true;
})

function deploy() {
  $("#error").css("display", "none");

  const truthContract = $("#truth_contract").val();
  const tokenContract = $("#token_contract").val();
  const stakeRequired = $("#stake_required").val();
  const canDisperse = $("#can_disperse").checked;
  const skipFirstEpisode = $("#skip_first_episode").checked;

  if (!truthContract || !tokenContract || !stakeRequired) {
    $("#error").text("Make sure to provide all details");
    $("#error").css("display", "block");
    return;
  }

  const erc20instance = erc20.at(tokenContract);
  erc20instance.decimals.call((err, decimals) => {
    const stake = new BN(stakeRequired).mul(new BN(10).pow(new BN(decimals.toString())));
    contract.new(
      truthContract,
      tokenContract,
      stake,
      canDisperse,
      skipFirstEpisode,
      { data: artifact.bytecode },
      (err, result) => {
        if (err) {
          $("#error").text(err);
          $("#error").css("display", "block");
          return;
        }
      }
    );
  });
}
