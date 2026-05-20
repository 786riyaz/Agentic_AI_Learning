import fs from "fs";
import path from "path";
import weaviate from "weaviate-client";
import { chunkText } from "./utils/chunk.js";
import { getEmbedding } from "./utils/embed.js";
import { makeId } from "./utils/id.js";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  httpSecure: false,
  grpcHost: "localhost",
  grpcPort: 50051,
  grpcSecure: false
});

const collection = client.collections.get("Documents");

function inferMeta(fileName, chunk) {
  const lower = chunk.toLowerCase();

  if (fileName.includes("cricket")) {
    let entity = "unknown";
    if (lower.includes("dhoni")) entity = "ms_dhoni";
    else if (lower.includes("kohli")) entity = "virat_kohli";
    else if (lower.includes("rohit")) entity = "rohit_sharma";
    else if (lower.includes("sachin")) entity = "sachin_tendulkar";

    return { category: "sports", entity };
  }

  if (fileName.includes("companies")) {
    let entity = "unknown";
    if (lower.includes("openai")) entity = "openai";
    else if (lower.includes("google")) entity = "google";
    else if (lower.includes("microsoft")) entity = "microsoft";

    return { category: "company", entity };
  }

  return { category: "general", entity: "unknown" };
}

const dataDir = "./data";
const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".txt"));

let inserted = 0;
let skipped = 0;

for (const file of files) {
  const fullPath = path.join(dataDir, file);
  const text = fs.readFileSync(fullPath, "utf-8");
  const chunks = chunkText(text);

  console.log(`\n📄 ${file} → ${chunks.length} chunks`);

  for (const chunk of chunks) {
    const { category, entity } = inferMeta(file, chunk);
    const id = makeId(chunk, file);

    try {
      const embedding = await getEmbedding(chunk);

      await collection.data.insert({
        uuid: id,
        properties: {
          text: chunk,
          source: file,
          category,
          entity
        },
        vector: embedding
      });

      inserted++;
    } catch (e) {
      if (String(e.message).includes("already exists")) {
        skipped++;
      } else {
        console.error("❌ Insert error:", e);
      }
    }
  }
}

console.log(`\n✅ Done | inserted=${inserted} skipped=${skipped}`);