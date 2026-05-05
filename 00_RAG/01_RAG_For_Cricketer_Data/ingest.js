import fs from "fs";
import weaviate from "weaviate-client";
import { chunkText } from "./utils/chunk.js";
import { getEmbedding } from "./utils/embed.js";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  httpSecure: false,
  grpcHost: "localhost",
  grpcPort: 50051,
  grpcSecure: false
});

const collection = client.collections.get("Documents");

const text = fs.readFileSync("./data/docs.txt", "utf-8");

const chunks = chunkText(text);

console.log("Chunks:", chunks);

for (let i = 0; i < chunks.length; i++) {
  const embedding = await getEmbedding(chunks[i]);

  await collection.data.insert({
    properties: {
      text: chunks[i],
      source: "docs.txt"
    },
    vector: embedding
  });

  console.log("Inserted chunk:", i);
}

console.log("✅ Ingestion done");