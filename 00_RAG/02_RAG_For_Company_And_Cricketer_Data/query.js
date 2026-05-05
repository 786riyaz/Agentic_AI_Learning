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

async function ask(query, opts = {}) {
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

  console.log("\n🔍 Retrieved documents:\n", result.objects);

  const context = [
    ...new Set(result.objects.map((o) => o.properties.text)),
  ].join("\n");

  console.log("\n📚 Context:\n", context);

  const prompt = `
You are a helpful assistant.

Context:
${context}

Question:
${query}

If the answer is not in the context, say "I don't know".
Answer clearly:
`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false,
  });

  console.log("\n🧠 Answer:\n", res.data.response);
}

// Examples:
await ask("Who is the best finisher in Indian cricket?", {
  category: "sports",
});
await ask("Who is the CEO of OpenAI?", {
  category: "company",
  entity: "openai",
});
