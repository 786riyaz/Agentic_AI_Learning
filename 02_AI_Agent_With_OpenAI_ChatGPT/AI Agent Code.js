import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- TOOL IMPLEMENTATION ----
function getAccountBalance() {
  return {
    balance: "$5,000",
    currency: "USD",
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
  const userQuery = "What is the capital of France?";
  const systemPrompt =
    "You are a helpful assistant that provides accurate information. You can call tools if needed.";

  let messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
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