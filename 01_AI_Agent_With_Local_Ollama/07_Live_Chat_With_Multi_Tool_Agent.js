/**
 * ============================================================
 * 🧠 LIVE STATEFUL MULTI-TOOL AGENT (SINGLE FILE)
 * ============================================================
 *
 * Features:
 * ✔ Live CLI chat (interactive)
 * ✔ Multi-tool support (banking + payments)
 * ✔ Stateful system (balance + transactions update)
 * ✔ Dynamic tool execution (registry-based)
 * ✔ Ollama compatible (local LLM)
 *
 * ============================================================
 */

import OpenAI from "openai";
import readline from "node:readline";

/**
 * ------------------------------------------------------------
 * 🔌 OPENAI CLIENT (OLLAMA)
 * ------------------------------------------------------------
 */
const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

/**
 * ============================================================
 * 🧠 IN-MEMORY DATABASE (STATE LAYER)
 * ============================================================
 *
 * NOTE:
 * This simulates a backend DB.
 * Replace this with MongoDB / PostgreSQL in production.
 */
const db = {
  balance: 5000,
  currency: "INR",
  transactions: [
    { id: 1, amount: -200, type: "debit", desc: "Food" },
    { id: 2, amount: 1500, type: "credit", desc: "Salary" },
    { id: 3, amount: -500, type: "debit", desc: "Shopping" },
    { id: 4, amount: -100, type: "debit", desc: "Taxi" },
  ],
};

/**
 * ============================================================
 * 🛠️ TOOL IMPLEMENTATIONS (BUSINESS LOGIC)
 * ============================================================
 */

/**
 * Get current account balance
 */
function getAccountBalance() {
  return {
    balance: db.balance,
    currency: db.currency,
  };
}

/**
 * Get recent transactions
 */
function getRecentTransactions({ limit = 5 }) {
  return {
    transactions: db.transactions.slice(-limit).reverse(),
  };
}

/**
 * Make a payment (STATE UPDATE happens here)
 */
function makePayment({ amount, to }) {
  if (!amount || !to) {
    return {
      status: "failed",
      message: "Invalid payment details",
    };
  }

  if (amount > db.balance) {
    return {
      status: "failed",
      message: "Insufficient balance",
    };
  }

  // Update balance
  db.balance -= amount;

  // Add transaction
  const newTx = {
    id: db.transactions.length + 1,
    amount: -amount,
    type: "debit",
    desc: `Sent to ${to}`,
  };

  db.transactions.push(newTx);

  return {
    status: "success",
    message: `₹${amount} sent to ${to}`,
    updatedBalance: db.balance,
  };
}

/**
 * ============================================================
 * 🧠 TOOL REGISTRY (DYNAMIC EXECUTION)
 * ============================================================
 */
const toolRegistry = {
  getAccountBalance,
  getRecentTransactions,
  makePayment,
};

/**
 * ============================================================
 * 📦 TOOL DEFINITIONS (MODEL SIDE)
 * ============================================================
 */
const tools = [
  {
    type: "function",
    function: {
      name: "getAccountBalance",
      description: "Get user's current account balance",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecentTransactions",
      description: "Fetch recent transactions",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "makePayment",
      description: "Send money to another person",
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
 * 🤖 AGENT MEMORY (CONVERSATION STATE)
 * ============================================================
 */
const messages = [
  {
    role: "system",
    content: `
You are a financial AI assistant.

Capabilities:
- Check balance
- View transactions
- Send payments

Rules:
- ALWAYS use tools for financial actions
- Never guess values
- Be clear and professional
`,
  },
];

/**
 * ============================================================
 * 🔁 PROCESS SINGLE USER MESSAGE
 * ============================================================
 */
async function processUserMessage(userInput) {
  messages.push({ role: "user", content: userInput });

  while (true) {
    const response = await client.chat.completions.create({
      model: "qwen2.5",
      messages,
      tools,
    });

    const choice = response.choices[0];

    /**
     * TOOL CALL HANDLING
     */
    if (choice.finish_reason === "tool_calls") {
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name;

        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch (err) {
          console.error("Invalid tool args:", err);
        }

        const toolFn = toolRegistry[toolName];

        if (!toolFn) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        const result = toolFn(args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      continue; // let model process tool result
    }

    /**
     * FINAL RESPONSE
     */
    messages.push(choice.message);
    return choice.message.content;
  }
}

/**
 * ============================================================
 * 💬 LIVE CLI CHAT LOOP
 * ============================================================
 */
async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🤖 AI Agent Ready (Stateful). Type 'exit' to quit.\n");

  function ask() {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      try {
        const reply = await processUserMessage(input);
        console.log("AI:", reply);
        console.log("--------------------------------------------------\n");
      } catch (err) {
        console.error("Error:", err);
      }

      ask(); // loop continues
    });
  }

  ask();
}

/**
 * ------------------------------------------------------------
 * 🚀 START APPLICATION
 * ------------------------------------------------------------
 */
startChat();