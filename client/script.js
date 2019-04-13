
let haveWeb3 = false;

const characterInsert = `
<div class="character">
  <label for="char_CHARACTER_IDX_dies">CHARACTER_NAME Dies</label>
  <input type="checkbox" id="char_CHARACTER_IDX_dies" name="char_CHARACTER_IDX_dies" />
  <select id="death_episode_CHARACTER_IDX" disabled="true">
    <option>Select One...</option>
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

const characterOptionInsert = `<option value="CHARACTER_IDX">CHARACTER_NAME</option>`;

function contractChanged() {
  const contract = $("#pool_contract").val();
  let isValid = true;
  isValid = isValid && contract.startsWith("0x");
  isValid = isValid && contract.length === 42;
  //isValid = isValid && haveWeb3;

  if (isValid) {
    $("#prediction").css("display", "block");
  }
  else {
    $("#prediction").css("display", "none");
  }
}

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

  $.getJSON("GOTDeathPool.json", (data) => {
    artifact = data;
  });

  // Now you can start your app & access web3 freely:
  haveWeb3 = true;
  contractChanged();

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
})
