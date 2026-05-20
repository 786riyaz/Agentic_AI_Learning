import weaviate from "weaviate-client";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  httpSecure: false,
  grpcHost: "localhost",
  grpcPort: 50051,
  grpcSecure: false
});

try {
  await client.collections.delete("Documents");
  console.log("🧹 Collection deleted");
} catch {
  console.log("ℹ️ Nothing to delete");
}