
let haveWeb3 = false;

const characterInsert = `
<div class="character">
  <label for="char_CHARACTER_IDX_dies">CHARACTER_NAME Dies</label>
  <input type="checkbox" id="char_CHARACTER_IDX_dies" name="char_CHARACTER_IDX_dies" onclick="diesChange(this);" />
  <select id="death_episode_CHARACTER_IDX" disabled="true">
    <option value="null">Select One...</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
    <option value="6">6</option>
  </select>
</div>
`;

let artifact;
let contract;
let instance;
let erc20;
let lastAddress;
let stakeString;
let erc20Symbol;

const characterOptionInsert = `<option value="CHARACTER_IDX">CHARACTER_NAME</option>`;

function diesChange(element) {
  if (element.checked) {
    $($(element).parent().find("select")[0]).prop("disabled", false);
  }
  else {
    $($(element).parent().find("select")[0]).prop("disabled", true);
  }
}

function stake() {
  const contractAddress = $("#pool_contract").val();
  $("#error").css("display", "none");

  instance.tokenAddress.call((err, address) => {
    if (!err && address) {
      const erc20instance = erc20.at(address);
      instance.requiredStake.call((err, stake) => {
        instance.stake.sendTransaction((err, result) => {
          if (err) {
            $("#error").text(err);
            $("#error").css("display", "block");
          }
        });
        erc20instance.approve.sendTransaction(contractAddress, stake, (err, result) => {
          if (err) {
            $("#error").text(err);
            $("#error").css("display", "block");
          }
        });
      });
    }
  });
}

function withdraw() {
  $("#error").css("display", "none");

  instance.withdraw.sendTransaction((err, result) => {
    if (err) {
      $("#error").text(err);
      $("#error").css("display", "block");
    }
  });
}

function predict() {
  const dies = [];
  const deathEpisode = [];

  $("#error").css("display", "none");

  const children = $("#characters").children();
  for (let i = 0; i < children.length; i++) {
    const element = children[i];
    const charDies = $(element).find("input")[0].checked;
    dies.push(charDies);
    if (charDies) {
      const episode = $(element).find("select").val();
      if (episode === "null") {
        $("#error").text(`Pick the episode ${characters[i]} dies`);
        $("#error").css("display", "block");
        return;
      }
      else {
        deathEpisode.push(parseInt(episode));
      }
    }
    else {
      deathEpisode.push(0);
    }
  }

  let firstToDie = $("#first_to_die").val();
  if (firstToDie === "null") {
    $("#error").text(`Pick the first character to die`);
    $("#error").css("display", "block");
    return;
  }
  else {
    firstToDie = parseInt(firstToDie);
  }

  let lastToDie = $("#last_to_die").val();
  if (lastToDie === "null") {
    $("#error").text(`Pick the last character to die`);
    $("#error").css("display", "block");
    return;
  }
  else {
    lastToDie = parseInt(lastToDie);
  }

  let lastOnThrone = $("#last_on_thrown").val();
  if (lastOnThrone === "null") {
    $("#error").text(`Pick the last character to occupy the throne/rule of Westeros`);
    $("#error").css("display", "block");
    return;
  }
  else {
    lastOnThrone = parseInt(lastOnThrone);
  }

  const name = $("#name").val();

  if (name === "") {
    $("#error").text(`Set something to be your "name" for the leaderboard`);
    $("#error").css("display", "block");
    return;
  }

  instance.predict.sendTransaction(
    dies,
    deathEpisode,
    firstToDie,
    lastToDie,
    lastOnThrone,
    name,
    (err, result) => {
      if (err) {
        $("#error").text(err);
        $("#error").css("display", "block");
      }
    }
  );
}

function contractChanged() {
  const contractAddress = $("#pool_contract").val();
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

    instance.tokenAddress.call((err, address) => {
      if (!err && address) {
        const erc20instance = erc20.at(address);
        erc20instance.symbol.call((err, symbol) => {
          erc20Symbol = symbol;
          erc20instance.decimals.call((err, decimals) => {
            instance.requiredStake.call((err, stake) => {
              if (!err && stake && decimals) {
                const numDecimals = decimals.toNumber();
                const stakeBn = new BN(stake.toString()).div(new BN(10).pow(new BN(numDecimals)));
                stakeString = stakeBn.toString();
                $("#stake").val(`Stake ${stakeString} ${symbol}`);
                $("#withdraw").val(`Withdraw ${stakeString} ${symbol}`);
              }
            });
          });
        });
      }
    });

    instance.havePredicted.call((err, result) => {
      if (!err && result === true) {
        $("#stake").css("display", "block");
      }
      else {
        $("#stake").css("display", "none");
      }
    });

    instance.haveStaked.call((err, result) => {
      if (!err && result === true) {
        $("#stake").css("display", "none");
        $("#withdraw").css("display", "block");
      }
      else {
        $("#withdraw").css("display", "none");
      }
    });
  }

  if (isValid) {
    $("#prediction").css("display", "block");
    $("#share").css("display", "block");
  }
  else {
    $("#prediction").css("display", "none");
    $("#share").css("display", "none");
  }
}

window.addEventListener('load', function() {
  const contractAddress = getUrlParameter("contract");
  if (contractAddress) {
    $("#pool_contract").val(contractAddress);
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
  erc20 = web3js.eth.contract(erc20abi);

  $.getJSON("GOTDeathPool.json", (data) => {
    artifact = data;

    contract = web3js.eth.contract(artifact.abi);
  
    // Now you can start your app & access web3 freely:
    haveWeb3 = true;
    contractChanged();
  });

  for (let i = 0; i < characters.length; i++) {
    if (i < characters.length - 2) {
      $("#characters").append(
        characterInsert
        .replace(/CHARACTER_NAME/, characters[i])
        .replace(/CHARACTER_IDX/, i)
      );
      $("#first_to_die").append(
        characterOptionInsert
        .replace(/CHARACTER_NAME/, characters[i])
        .replace(/CHARACTER_IDX/, i)
      );
      $("#last_to_die").append(
        characterOptionInsert
        .replace(/CHARACTER_NAME/, characters[i])
        .replace(/CHARACTER_IDX/, i)
      );
    }

    $("#last_on_thrown").append(
      characterOptionInsert
      .replace(/CHARACTER_NAME/, characters[i])
      .replace(/CHARACTER_IDX/, i)
    );
  }
});

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function copyLink() {
  const copyText = `https://seesemichaelj.github.io/game-of-thrones-death-pool/?contract=${$("#pool_contract").val()}`;

  $("#copy").val(copyText);
  $("#copy").select();
  document.execCommand("copy");

  $("#share").val("Copied!");

  setTimeout(() => {
    $("#share").val("Copy Shareable Link!");
  }, 2500);
}
