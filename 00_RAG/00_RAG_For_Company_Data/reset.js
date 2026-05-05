import weaviate from "weaviate-client";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  grpcHost: "localhost",
  grpcPort: 50051
});

async function waitForWeaviate(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch("http://localhost:8081/v1/meta");
      console.log("✅ Weaviate is ready");
      return;
    } catch {
      console.log("⏳ Waiting for Weaviate...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("Weaviate not ready");
}

await waitForWeaviate();

await client.collections.delete("Documents");

console.log("🧹 Collection deleted");