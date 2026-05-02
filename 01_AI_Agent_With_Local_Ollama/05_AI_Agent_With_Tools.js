import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1", // ommit if using OpenAI's API, but required for Ollama
  apiKey: "ollama",
  //   apiKey: process.env.OPENAI_API_KEY,
});

// ---- TOOL IMPLEMENTATION ----
function getAccountBalance() {
  return {
    balance: "5000",
    currency: "INR",
  };
}

// ---- TOOL DEFINITION (for model) ----
const tools = [
  {
    type: "function",
    function: {
      name: "getAccountBalance",
      description: "Get the user's current account balance",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

async function runAgent() {
  const userQuery = "What is my account balance?";
  const systemPrompt = `
    "You are an AI agent.

If user asks about account balance, respond EXACTLY in this format:
TOOL_CALL: getAccountBalance

Otherwise, answer normally but be helpful and maintain a professional tone and give informational and accurate responses. `;

  let messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      // model: "gpt-4o-mini",
      // model: "llama3",                   // does not support tool calls, but good for testing non-tool responses
      // model: "deepseek-coder",           // does not support tool calls, but good for testing non-tool responses
      // model: "deepseek-r1",              // does not support tool calls, but good for testing non-tool responses
      // model: "qwen3-coder:30b",          // supports tool calls, but heavy for testing and give to much load to the GPU
      model: "qwen2.5",                     // supports tool calls and fast for testing but sometimes gives non-deterministic responses and may not always call the tool when expected
      messages,
      tools,
    });

    const choice = response.choices[0];

    // ---- CHECK IF TOOL IS CALLED ----
    if (choice.finish_reason === "tool_calls") {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;

      let toolResult;

      if (toolName === "getAccountBalance") {
        toolResult = getAccountBalance();
      }

      // Add assistant tool call message
      messages.push(choice.message);

      // Add tool response
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });

      continue; // loop again with tool result
    }

    // ---- FINAL RESPONSE ----
    console.log(choice.message.content);
    break;
  }
}

runAgent();


/*
Your current account balance is 5000 INR.
*/