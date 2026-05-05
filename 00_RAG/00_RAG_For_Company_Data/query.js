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

async function ask(query) {
  // Debug stored data
  const all = await collection.query.fetchObjects({
    limit: 2,
    includeVector: true, // 🔥 IMPORTANT
  });

  console.log("All stored objects with vectors:");
  console.log(JSON.stringify(all, null, 2));
  console.log(
    "\n📦 Stored Data:",
    all.objects.map((o) => o.properties.text),
  );

  // ✅ FIX: generate query embedding
  const queryVector = await getEmbedding(query);

  // ✅ FIX: pass vector explicitly
  const result = await collection.query.hybrid(query, {
    vector: queryVector,
    alpha: 0.7,
    limit: 3,
  });

  console.log("\n🔍 RAW RESULT:", JSON.stringify(result, null, 2));

  const context = result.objects.map((o) => o.properties.text).join("\n");

  console.log("\n📚 Retrieved Context:\n", context);

  const prompt = `
Context:
${context}

Question:
${query}

Answer clearly:
`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false,
  });

  console.log("\n🧠 Final Answer:\n", res.data.response);
}

// ask("Who is the CEO of OpenAI?");