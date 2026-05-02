// We have call a Tools method like this because the ollama does not support tool calls yet. So we have to detect the tool call in the response and then call the tool manually.
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

function getAccountBalance() {
  return { balance: "$5000" };
}

async function runAgent() {
  let messages = [
    {
      role: "system",
      content: `
You are an AI agent.

If user asks about account balance, respond EXACTLY in this format:
TOOL_CALL: getAccountBalance

Otherwise, answer normally.
      `,
    },
    { role: "user", content: "What is my account balance?" },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: "llama3",
      messages,
    });

    const text = response.choices[0].message.content;
    console.log("Model:", text);

    // 🔧 detect tool call manually
    if (text.includes("TOOL_CALL: getAccountBalance")) {
      const result = getAccountBalance();

      messages.push({
        role: "assistant",
        content: text,
      });

      messages.push({
        role: "user",
        content: `Tool result: ${JSON.stringify(result)}`,
      });

      continue;
    }

    break;
  }
}

runAgent();