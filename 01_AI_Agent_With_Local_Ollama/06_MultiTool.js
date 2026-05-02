/**
 * ============================================================
 * MULTI-TOOL AI AGENT (BANKING + PAYMENTS)
 * ============================================================
 *
 * Features:
 * ✔ Multiple tools (account, transactions, payments)
 * ✔ Dynamic tool routing (no hardcoded if-else chains)
 * ✔ Argument support (tool inputs)
 * ✔ Scalable architecture (plug-and-play tools)
 * ✔ Ollama + OpenAI SDK compatible
 *
 * ============================================================
 */

import OpenAI from "openai";

/**
 * ------------------------------------------------------------
 * CLIENT CONFIGURATION (OLLAMA)
 * ------------------------------------------------------------
 */
const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

/**
 * ============================================================
 * 🛠️ TOOL IMPLEMENTATIONS (BUSINESS LOGIC LAYER)
 * ============================================================
 */

/**
 * Get account balance
 */
function getAccountBalance() {
  return {
    balance: "5000",
    currency: "INR",
  };
}

/**
 * Get last N transactions
 * @param {Object} args
 * @param {number} args.limit
 */
function getRecentTransactions({ limit = 3 }) {
  return {
    transactions: [
      { id: 1, amount: -200, type: "debit", desc: "Food" },
      { id: 2, amount: 1500, type: "credit", desc: "Salary" },
      { id: 3, amount: -500, type: "debit", desc: "Shopping" },
    ].slice(0, limit),
  };
}

/**
 * Make a payment
 * @param {Object} args
 * @param {number} args.amount
 * @param {string} args.to
 */
function makePayment({ amount, to }) {
  return {
    status: "success",
    message: `₹${amount} sent to ${to}`,
  };
}

/**
 * ============================================================
 * 🧠 TOOL REGISTRY (SINGLE SOURCE OF TRUTH)
 * ============================================================
 *
 * Maps tool names → actual implementations
 * Enables dynamic execution without if-else chains
 */
const toolRegistry = {
  getAccountBalance,
  getRecentTransactions,
  makePayment,
};

/**
 * ============================================================
 * 📦 TOOL DEFINITIONS (MODEL-FACING SCHEMA)
 * ============================================================
 *
 * JSON Schema definitions help model:
 * - Understand when to call tools
 * - Know required parameters
 */
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
  {
    type: "function",
    function: {
      name: "getRecentTransactions",
      description: "Get recent transactions",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of transactions to return",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "makePayment",
      description: "Send money to another user",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          to: { type: "string" },
        },
        required: ["amount", "to"],
      },
    },
  },
];

/**
 * ============================================================
 * 🤖 AGENT EXECUTION ENGINE
 * ============================================================
 */
async function runAgent() {
  const userQuery = "Send 1000 rupees to Rahul and show my balance";

  /**
   * SYSTEM PROMPT
   *
   * NOTE:
   * - No hacky TOOL_CALL string needed
   * - Proper tool definitions guide the model
   */
  const systemPrompt = `
You are a financial AI assistant.

You can:
- Check account balance
- Fetch transactions
- Send payments

Use tools whenever required.
Be precise and professional.
`;

  let messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery },
  ];

  /**
   * ------------------------------------------------------------
   * AGENT LOOP
   * ------------------------------------------------------------
   */
  while (true) {
    const response = await client.chat.completions.create({
      model: "qwen2.5",
      messages,
      tools,
    });

    const choice = response.choices[0];

    /**
     * --------------------------------------------------------
     * TOOL CALL HANDLING (GENERIC)
     * --------------------------------------------------------
     */
    if (choice.finish_reason === "tool_calls") {
      const toolCalls = choice.message.tool_calls;

      // Push assistant message (contains tool calls)
      messages.push(choice.message);

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;

        /**
         * Parse arguments safely
         */
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch (err) {
          console.error("Invalid JSON args:", err);
        }

        /**
         * Dynamic tool execution via registry
         */
        const toolFn = toolRegistry[toolName];

        if (!toolFn) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        const result = toolFn(args);

        /**
         * Push tool response
         */
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      continue; // Loop again for final response
    }

    /**
     * --------------------------------------------------------
     * FINAL RESPONSE
     * --------------------------------------------------------
     */
    console.log(choice.message.content);
    break;
  }
}

/**
 * ------------------------------------------------------------
 * START AGENT
 * ------------------------------------------------------------
 */
runAgent();


/*
The payment of 1000 INR has been successfully sent to Rahul. Your current account balance is 5000 INR.
*/