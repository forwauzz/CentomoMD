// TypeScript version
import { enhanceVoiceInput } from "./ai-formatter"; // Remove .js extension

console.log("🧪 Testing Voice Enhancement System...\n");

const testCases = [
  "le patient a vu le docter hier",
  "infiltration cortisone au supra épineu",
  "physio thérapie et I.R.M du genou droit",
  "la patiente se plaint de douleur",
  "dopler veineux et échograpie",
  "E.M.G montre une amélioration",
];

testCases.forEach((test, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  console.log("🎤 Voice Input:", test);

  const result = enhanceVoiceInput(test);

  console.log("✨ Enhanced:", result.enhanced);
  console.log("🔧 Corrections:", result.corrections);

  if (result.corrections.length === 0) {
    console.log("ℹ️  No corrections needed");
  }
});

console.log("\n✅ Voice enhancement test complete!");
