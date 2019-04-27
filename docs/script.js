
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
const leaderboardInsert = `<li>PLAYER_NAME: PLAYER_POINTS Points</li>`;
const deathInsert = `<li>CHARACTER_NAME</li>`;

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

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
      let erc20instance;
      if (address === "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359") {
        erc20instance = web3js.eth.contract(daiabi).at(address);
      }
      else {
        erc20instance = erc20.at(address);
      }
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

function claim() {
  $("#error").css("display", "none");

  instance.claim.sendTransaction((err, result) => {
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

  let lastOnThrone = $("#last_on_throne").val();
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
        let erc20instance;
        if (address === "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359") {
          erc20instance = web3js.eth.contract(daiabi).at(address);
        }
        else {
          erc20instance = erc20.at(address);
        }
        erc20instance.symbol.call((err, symbol) => {
          erc20Symbol = symbol.startsWith("0x") ? hex2a(symbol) : symbol;
          erc20instance.decimals.call((err, decimals) => {
            instance.requiredStake.call((err, stake) => {
              if (!err && stake && decimals) {
                const numDecimals = decimals.toNumber();
                const stakeBn = new BN(stake.toString()).div(new BN(10).pow(new BN(numDecimals)));
                stakeString = stakeBn.toString();
                $("#stake").val(`Stake ${stakeString} ${erc20Symbol}`);
                $("#withdraw").val(`Withdraw ${stakeString} ${erc20Symbol}`);
              }
            });
          });
        });
      }
    });

    instance.havePredicted.call((err, result) => {
      if (!err && result === true) {
      }
      else {
      }
    });

    instance.haveStaked.call((err, result) => {
      if (!err && result === true) {
        $("#stake").css("display", "none");

        instance._open.call((err, result) => {
          if (!err && result === true) {
            $("#withdraw").css("display", "block");
          }
          else {
            $("#withdraw").css("display", "none");
          }
        });
      }
      else {
        $("#stake").css("display", "block");
        $("#withdraw").css("display", "none");
      }
    });

    instance._open.call((err, result) => {
      if (!err && result === true) {
        $("#prediction").css("display", "block");
        $("#leaderboard_toggle").css("display", "none");
        $("#truth_toggle").css("display", "none");
      }
      else {
        $("#prediction").css("display", "none");
        $("#leaderboard_toggle").css("display", "block");
        $("#truth_toggle").css("display", "block");
        $("#withdraw").css("display", "none");

        instance.predictions.call(web3js.eth.defaultAccount, (err, result) => {
          if (!err && result[0] === true) {
            $("#my_prediction").css("display", "block");
            const firstToDie = result[1].toNumber();
            const lastToDie = result[3].toNumber();
            const lastOnThrone = result[4].toNumber();

            $("#my_first_to_die_truth").text(characters[firstToDie]);
            $("#my_last_to_die_truth").text(characters[lastToDie]);
            $("#my_last_on_throne_truth").text(characters[lastOnThrone]);
          }
          else {
            $("#my_prediction").css("display", "none");
          }
        })

        instance.TruthContract.call((err, result) => {
          if (!err && result) {
            $.getJSON("GOTDeathPoolTruth.json?v=6", (data) => {
              artifact = data;

              const truthContract = web3js.eth.contract(data.abi);
              const truthInstance = truthContract.at(result);
              truthInstance.GetTruthDies.call((err, dies) => {
                if (err) {
                  console.err(err);
                  return;
                }
                truthInstance.GetTruthDeathEpisode.call((err, deathEpisode) => {
                  if (err) {
                    console.err(err);
                    return;
                  }
                  truthInstance.GetTruthFirstToDie.call((err, firstToDie) => {
                    if (err) {
                      console.err(err);
                      return;
                    }
                    truthInstance.GetTruthFirstToDieAfterFirstEpisode.call((err, firstToDieAfterFirstEpisode) => {
                      if (err) {
                        console.err(err);
                        return;
                      }
                      truthInstance.GetTruthLastToDie.call((err, lastToDie) => {
                        if (err) {
                          console.err(err);
                          return;
                        }
                        truthInstance.GetTruthLastOnThrone.call((err, lastOnThrone) => {
                          if (err) {
                            console.err(err);
                            return;
                          }
                          for (let i = 0; i < characters.length - 2; i++) {
                            if (dies[i]) {
                              $($(`#episode${deathEpisode[i]} ul`)[0]).append(deathInsert.replace(/CHARACTER_NAME/g, characters[i]));
                            }
                          }
                          $("#first_to_die_truth").text(characters[firstToDie]);
                          $("#first_to_die_after_first_episode_truth").text(characters[firstToDieAfterFirstEpisode]);
                          $("#last_to_die_truth").text(characters[lastToDie]);
                          $("#last_on_throne_truth").text(characters[lastOnThrone]);
                        });
                      });
                    });
                  });
                })
              })
            });
          }
        });
      }
    });

    instance._canClaim.call(async (err, result) => {
      if (!err && result === true) {
        $("#claim").css("display", "block");
      }
      else {
        $("#claim").css("display", "none");
      }
    });

    instance.calculatePoints.call(async (err, result) => {
      if (err) {
        console.error(err);
      }
      else {
        const leaderboard = $("#leaderboard ul")[0];
        if (leaderboard) {
          const data = [];
          const points = result["0"];
          const addresses = result["1"];
          for (let i = 0; i < points.length; i++) {
            const name = await new Promise((resolve, reject) => {
              instance.getName.call(addresses[i], (err, result) => {
                if (err) {
                  reject(err);
                }
                else {
                  resolve(result);
                }
              })
            });
            data.push({
              points: points[i],
              address: addresses[i],
              name,
            });
          }
          data.sort((a, b) => b.points.sub(a.points));
          for (let i = 0; i < data.length; i++) {
            $(leaderboard).append(leaderboardInsert.replace(/PLAYER_NAME/g, data[i].name).replace(/PLAYER_POINTS/g, data[i].points))
          }
        }
      }
    });
  }

  if (isValid) {
    $("#prediction").css("display", "block");
    $("#share").css("display", "block");
    $("#stake").css("display", "block");
  }
  else {
    $("#prediction").css("display", "none");
    $("#share").css("display", "none");
    $("#stake").css("display", "none");
  }
}

function toggleInstructions() {
  $("#instructions").toggle();
}

function toggleLeaderboard() {
  $("#leaderboard").toggle();
}

function toggleTruth() {
  $("#truth").toggle();
}

window.addEventListener('load', function() {
  const contractAddress = getUrlParameter("contract");
  if (contractAddress) {
    $("#pool_contract").val(contractAddress);
  }

  window.ethereum.enable().then((accounts) => {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      web3js = new Web3(web3.currentProvider);
    } else {
      console.log('No web3? You should consider trying MetaMask!')
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    web3js.eth.defaultAccount = accounts[0];
    erc20 = web3js.eth.contract(erc20abi);

    $.getJSON("GOTDeathPool.json?v=6", (data) => {
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
          .replace(/CHARACTER_NAME/g, characters[i])
          .replace(/CHARACTER_IDX/g, i)
        );
        $("#first_to_die").append(
          characterOptionInsert
          .replace(/CHARACTER_NAME/g, characters[i])
          .replace(/CHARACTER_IDX/g, i)
        );
        $("#last_to_die").append(
          characterOptionInsert
          .replace(/CHARACTER_NAME/g, characters[i])
          .replace(/CHARACTER_IDX/g, i)
        );
      }

      $("#last_on_throne").append(
        characterOptionInsert
        .replace(/CHARACTER_NAME/g, characters[i])
        .replace(/CHARACTER_IDX/g, i)
      );
    }
  });
});

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function copyLink() {
  const copyText = `https://seesemichaelj.github.io/game-of-thrones-death-pool/?contract=${$("#pool_contract").val()}`;

  copyToClipboard(copyText);

  $("#share").val("Copied!");

  setTimeout(() => {
    $("#share").val("Copy Shareable Link!");
  }, 2500);
}
const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};
