import weaviate from "weaviate-client";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  httpSecure: false,
  grpcHost: "localhost",
  grpcPort: 50051,
  grpcSecure: false,
});

try {
  await client.collections.create({
    name: "Documents",
    vectorizer: "none",

    vectorIndexConfig: {
      distance: "cosine",
    },

    properties: [
      { name: "text", dataType: "text" },
      { name: "source", dataType: "text" },
    ],

    // 🔥 ADD THIS
    vectorConfig: {
      default: {
        vectorIndexType: "hnsw",
      },
    },
  });

  console.log("✅ Collection created");
} catch {
  console.log("⚠️ Collection already exists");
}
