
let haveWeb3 = false;


let artifact;
let contract;
let instance;
let lastAddress;

function logEpisode() {
  const deathStateByName = JSON.parse($("#death_state").val());
  const deathState = [];
  for (let i = 0; i < characters.length; i++) {
    deathState.push(deathStateByName[characters[i]]);
  }
  const episode = parseInt($("#episode").val());
  const throneOwner = parseInt($("#throne_owner").val());
  instance.logEpisode.sendTransaction(deathState, episode, throneOwner, (err, result) => {
    console.log(err);
    console.log(result);
  });
}

function logFirstToDie() {
  const firstToDie = parseInt($("#first_to_die").val());
  instance.logFirstToDie.sendTransaction(firstToDie, (err, result) => {
    console.log(err);
    console.log(result);
  });
}

function logFirstToDieAfterFirstEpisode() {
  const firstToDieAfterFirstEpisode = parseInt($("#first_to_die_after_first_episode").val());
  instance.logFirstToDieAfterFirstEpisode.sendTransaction(firstToDieAfterFirstEpisode, (err, result) => {
    console.log(err);
    console.log(result);
  });
}

function logLastToDie() {
  const lastToDie = parseInt($("#last_to_die").val());
  instance.logLastToDie.sendTransaction(lastToDie, (err, result) => {
    console.log(err);
    console.log(result);
  });
}

function complete() {
  instance.complete.sendTransaction((err, result) => {
    console.log(err);
    console.log(result);
  });
}

function incomplete() {
  instance.incomplete.sendTransaction((err, result) => {
    console.log(err);
    console.log(result);
  });
}

function contractChanged() {
  const contractAddress = $("#truth_contract").val();
  if (contractAddress === lastAddress) {
    return;
  }
  lastAddress = contractAddress;
  let isValid = true;
  isValid = isValid && contractAddress.startsWith("0x");
  isValid = isValid && contractAddress.length === 42;
  isValid = isValid && haveWeb3;

  if (isValid) {
    instance = contract.at(contractAddress);
  }
}

window.addEventListener('load', function() {
  const contractAddress = getUrlParameter("contract");
  if (contractAddress) {
    $("#truth_contract").val(contractAddress);
  }

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3js = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  web3js.eth.defaultAccount = web3js.eth.accounts[0];

  $.getJSON("GOTDeathPoolTruth.json?v=8", (data) => {
    artifact = data;

    contract = web3js.eth.contract(artifact.abi);
  
    // Now you can start your app & access web3 freely:
    haveWeb3 = true;
    contractChanged();
  });
})

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
