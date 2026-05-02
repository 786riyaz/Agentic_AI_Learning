Here is a **fully structured, professional README-style documentation** for your code. I have preserved *all details* and clarified concepts without removing anything.

---

# 🧠 AI Agent with Tool Calling (Ollama + OpenAI SDK)

## 📌 Overview

This project demonstrates how to build a **tool-calling AI agent** using the OpenAI-compatible SDK with a **local LLM (Ollama)**.

The agent:

* Accepts user input
* Decides whether to call a tool
* Executes the tool if needed
* Returns the final response

---

## ⚙️ Tech Stack

* **Node.js**
* **OpenAI SDK (compatible with Ollama)**
* **Ollama (Local LLM runtime)**
* Model used: `qwen2.5`

---

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install openai
```

---

### 2. Start Ollama

Make sure Ollama is running locally:

```bash
ollama run qwen2.5
```

---

### 3. Configuration

```js
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1", // Required for Ollama
  apiKey: "ollama", // Dummy key for local usage
});
```

---

## 🛠️ Tool Implementation

### Function: `getAccountBalance`

```js
function getAccountBalance() {
  return {
    balance: "5000",
    currency: "INR",
  };
}
```

### Purpose

Returns the user's account balance.

---

## 🔧 Tool Definition (for Model)

```js
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
```

### Explanation

* `type`: Defines this as a callable function
* `name`: Must match the actual function name
* `description`: Helps the model understand when to use it
* `parameters`: Empty object (no input required)

---

## 🤖 Agent Logic

### Main Function: `runAgent()`

```js
async function runAgent() {
```

---

### 🔹 User Query

```js
const userQuery = "What is my account balance?";
```

---

### 🔹 System Prompt

```js
const systemPrompt = `
"You are an AI agent.

If user asks about account balance, respond EXACTLY in this format:
TOOL_CALL: getAccountBalance

Otherwise, answer normally but be helpful and maintain a professional tone and give informational and accurate responses. `;
```

### Purpose

* Forces the model to trigger tool usage
* Controls behavior strictly
* Prevents hallucination

---

### 🔹 Message Initialization

```js
let messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: userQuery },
];
```

---

## 🔁 Execution Loop

```js
while (true) {
```

This loop allows:

* Tool calling
* Response chaining
* Final answer generation

---

## 📡 Model Call

```js
const response = await client.chat.completions.create({
  model: "qwen2.5",
  messages,
  tools,
});
```

---

### 🧠 Model Options (Commented)

```js
// model: "gpt-4o-mini",
// model: "llama3",         // ❌ No tool support
// model: "deepseek-coder", // ❌ No tool support
// model: "deepseek-r1",    // ❌ No tool support
// model: "qwen3-coder:30b",// ⚠️ Heavy model
// model: "qwen2.5",        // ✅ Best balance
```

---

## 🔍 Tool Call Detection

```js
const choice = response.choices[0];

if (choice.finish_reason === "tool_calls") {
```

### Meaning

* Model decided to call a tool instead of responding normally

---

## 🧩 Extract Tool Call

```js
const toolCall = choice.message.tool_calls[0];
const toolName = toolCall.function.name;
```

---

## ⚡ Execute Tool

```js
let toolResult;

if (toolName === "getAccountBalance") {
  toolResult = getAccountBalance();
}
```

---

## 🧾 Append Messages

### Assistant Tool Call

```js
messages.push(choice.message);
```

### Tool Response

```js
messages.push({
  role: "tool",
  tool_call_id: toolCall.id,
  content: JSON.stringify(toolResult),
});
```

---

## 🔁 Continue Loop

```js
continue;
```

This allows the model to:

* Read tool output
* Generate final response

---

## ✅ Final Response

```js
console.log(choice.message.content);
break;
```

---

## 🧪 Full Execution

```js
runAgent();
```

---

## 🧠 Key Concepts

### 1. Tool Calling

The model:

* Decides when to call a function
* Outputs structured tool calls
* Waits for execution result

---

### 2. Determinism Issue

Model like `qwen2.5`:

* Sometimes **does NOT call tool consistently**
* Requires **strong prompt engineering**

---

### 3. Manual Enforcement

You used:

```txt
TOOL_CALL: getAccountBalance
```

This is a **prompt hack** to force tool usage.

---

## ⚠️ Known Limitations

* Some models (e.g., `llama3`, `deepseek`) **do NOT support tool calling**
* Larger models = **high GPU usage**
* Smaller models = **less reliable tool behavior**

---

## 💡 Improvements (Optional)

* Add **arguments to tools**
* Add **multiple tools**
* Add **error handling**
* Add **streaming responses**
* Add **memory (conversation history)**

---

## 📌 Summary

This implementation shows:

✔ Local LLM integration (Ollama)
✔ Tool calling workflow
✔ Prompt-controlled behavior
✔ Iterative agent loop

---

If you want next level:

* Multi-tool agents (banking + payments + user profile)
* Auto tool selection (without prompt hacks)
* Function arguments parsing
* ReAct-style reasoning agent

Just tell me.
