const path = require("path");
const csv = require("csvtojson");
const fs = require("fs");
const {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} = require("quicktype-core");

async function quicktypeJSON(targetLanguage, typeName, jsonString) {
  const jsonInput = jsonInputForTargetLanguage(targetLanguage);
  await jsonInput.addSource({
    name: typeName,
    samples: [jsonString],
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  return await quicktype({
    inputData,
    lang: targetLanguage,
  });
}

async function main() {
  csv()
    .fromFile(path.resolve(__dirname, "data.csv"))
    .then(async (json) => {
      const { lines } = await quicktypeJSON(
        "ts",
        "BoyBandDatum",
        JSON.stringify(json)
      );
      const formatted = lines.join("\n");
      fs.writeFileSync("./types.ts", formatted);
    });
}

main();
