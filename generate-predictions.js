const fs = require("fs");

const predictions = [];
for (let i = 0; i < 10; i++) {
  predictions.push({
    dies: [],
    deathEpisode: [],
    firstToDie: Math.round(Math.random() * 29),
    lastToDie: Math.round(Math.random() * 29),
    lastOnThrone: Math.round(Math.random() * 29),
    name: `user${i}`,
  });

  for (let j = 0; j < 30; j++) {
    predictions[i].dies[j] = Math.random() >= 0.5;

    if (predictions[i].dies[j]) {
      predictions[i].deathEpisode[j] = 1 + Math.round(Math.random() * 5);
    }
    else {
      predictions[i].deathEpisode[j] = 0;
    }
  }
}

fs.writeFileSync("test/predictions.js", `module.exports = ${JSON.stringify(predictions)};`, { encoding: "utf8" });
