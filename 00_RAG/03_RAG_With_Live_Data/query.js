import axios from "axios";
import weaviate from "weaviate-client";
import { getEmbedding } from "./utils/embed.js";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  httpSecure: false,
  grpcHost: "localhost",
  grpcPort: 50051,
  grpcSecure: false,
});

const collection = client.collections.get("Documents");

// 🔥 CHAT MEMORY
let chatHistory = [];

export async function ask(query, opts = {}) {
  const { category, entity, limit = 3 } = opts;

  const queryVector = await getEmbedding(query);

  const filters = [];

  if (category) {
    filters.push({
      path: ["category"],
      operator: "Equal",
      valueText: category,
    });
  }

  if (entity) {
    filters.push({
      path: ["entity"],
      operator: "Equal",
      valueText: entity,
    });
  }

  const where =
    filters.length === 0
      ? undefined
      : filters.length === 1
      ? filters[0]
      : { operator: "And", operands: filters };

  const result = await collection.query.hybrid(query, {
    vector: queryVector,
    alpha: 0.7,
    limit,
    where,
  });

  const context = [
    ...new Set(result.objects.map((o) => o.properties.text)),
  ].join("\n");

  // 🔥 HISTORY
  const historyText = chatHistory
    .map((h) => `User: ${h.q}\nAssistant: ${h.a}`)
    .join("\n");

  const prompt = `
You are a helpful assistant.

Conversation so far:
${historyText}

Context:
${context}

User Question:
${query}

If the answer is not in the context, say "I don't know".

Answer clearly:
`;

  // 🔥 STREAMING RESPONSE
  const res = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3",
      prompt,
      stream: true,
    },
    {
      responseType: "stream",
    }
  );

  process.stdout.write("\n🧠 Answer:\n");

  let finalAnswer = "";

  res.data.on("data", (chunk) => {
    const lines = chunk.toString().split("\n").filter(Boolean);

    for (const line of lines) {
      const parsed = JSON.parse(line);

      if (parsed.response) {
        process.stdout.write(parsed.response);
        finalAnswer += parsed.response;
      }
    }
  });

  await new Promise((resolve) => {
    res.data.on("end", resolve);
  });

  console.log("\n");

  // 🔥 SAVE MEMORY
  chatHistory.push({ q: query, a: finalAnswer });

  // 🔥 LIMIT MEMORY
  if (chatHistory.length > 5) {
    chatHistory.shift();
  }
}