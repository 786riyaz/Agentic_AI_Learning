import readline from "readline";
import { ask } from "./query.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🤖 RAG Chat Ready (type 'exit' to quit)\n");

function promptUser() {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    await ask(input, {
      category: "sports", // you can improve later
    });

    promptUser();
  });
}

promptUser();