Below is a **complete, clean, reusable Markdown guide** for your RAG setup. You can copy this into a `.md` file (e.g., `RAG-Weaviate-Ollama.md`) and reuse anytime.

---

# 🚀 RAG Pipeline Setup (Node.js + Weaviate + Ollama)

## 📌 Overview

This project implements a **Retrieval-Augmented Generation (RAG)** system using:

* **Node.js** (backend)
* **Weaviate** (vector DB)
* **Ollama** (embeddings + LLM)

---

## 🧠 Architecture

```
User Query
   ↓
Embedding (nomic-embed-text)
   ↓
Weaviate (Vector + Hybrid Search)
   ↓
Top-K Context
   ↓
LLM (llama3)
   ↓
Final Answer
```

---

## ⚙️ Prerequisites

* Node.js (v18+)
* Docker Desktop
* Ollama installed

---

## 🐳 Step 1: Run Weaviate (Docker)

### PowerShell Command:

```powershell
docker run -d --name weaviate `
  -p 8081:8080 `
  -p 50051:50051 `
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true `
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate `
  -e DEFAULT_VECTORIZER_MODULE=none `
  -v weaviate_data:/var/lib/weaviate `
  semitechnologies/weaviate:latest
```

### Verify:

```
http://localhost:8081/v1/meta
```

---

## 🤖 Step 2: Setup Ollama

```bash
ollama pull nomic-embed-text
ollama pull llama3
ollama serve
```

---

## 📦 Step 3: Project Setup

```bash
npm init -y
npm install axios weaviate-client
```

### package.json

```json
{
  "type": "module"
}
```

---

## 📁 Project Structure

```
rag/
├── index.js
├── ingest.js
├── query.js
├── reset.js
├── data/docs.txt
└── utils/
    ├── embed.js
    └── chunk.js
```

---

## ✂️ utils/chunk.js

```js
export function chunkText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map(c => c.trim())
    .filter(c => c.length > 0);
}
```

---

## 🧠 utils/embed.js

```js
import axios from "axios";

export async function getEmbedding(text) {
  const res = await axios.post("http://localhost:11434/api/embeddings", {
    model: "nomic-embed-text",
    prompt: text
  });
  return res.data.embedding;
}
```

---

## 🧱 index.js (Create Collection)

```js
import weaviate from "weaviate-client";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  grpcHost: "localhost",
  grpcPort: 50051
});

try {
  await client.collections.create({
    name: "Documents",
    vectorizer: "none",
    properties: [
      { name: "text", dataType: "text" },
      { name: "source", dataType: "text" }
    ]
  });
  console.log("✅ Collection created");
} catch {
  console.log("⚠️ Collection already exists");
}
```

---

## 📥 ingest.js

```js
import fs from "fs";
import weaviate from "weaviate-client";
import { chunkText } from "./utils/chunk.js";
import { getEmbedding } from "./utils/embed.js";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  grpcHost: "localhost",
  grpcPort: 50051
});

const collection = client.collections.get("Documents");

const text = fs.readFileSync("./data/docs.txt", "utf-8");
const chunks = chunkText(text);

for (let i = 0; i < chunks.length; i++) {
  const embedding = await getEmbedding(chunks[i]);

  await collection.data.insert({
    properties: { text: chunks[i], source: "docs.txt" },
    vector: embedding
  });

  console.log("Inserted chunk:", i);
}

console.log("✅ Ingestion done");
```

---

## 🔍 query.js

```js
import axios from "axios";
import weaviate from "weaviate-client";
import { getEmbedding } from "./utils/embed.js";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  grpcHost: "localhost",
  grpcPort: 50051
});

const collection = client.collections.get("Documents");

async function ask(query) {
  const queryVector = await getEmbedding(query);

  const result = await collection.query.hybrid(query, {
    vector: queryVector,
    alpha: 0.7,
    limit: 1
  });

  const context = [...new Set(
    result.objects.map(o => o.properties.text)
  )].join("\n");

  console.log("📚 Context:\n", context);

  const prompt = `
Context:
${context}

Question:
${query}

Answer:
`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false
  });

  console.log("\n🧠 Answer:\n", res.data.response);
}

ask("Who is the CEO of OpenAI?");
```

---

## 🔄 reset.js

```js
import weaviate from "weaviate-client";

const client = await weaviate.connectToCustom({
  httpHost: "localhost",
  httpPort: 8081,
  grpcHost: "localhost",
  grpcPort: 50051
});

await client.collections.delete("Documents");
console.log("🧹 Collection deleted");
```

---

## 📄 data/docs.txt

```
OpenAI is an artificial intelligence company. The CEO of OpenAI is Sam Altman.

Google is a technology company. The CEO of Google is Sundar Pichai.

Microsoft is a multinational corporation. The CEO of Microsoft is Satya Nadella.
```

---

## ▶️ Run Order

```bash
node reset.js
node index.js
node ingest.js
node query.js
```

---

## 🧠 Key Concepts

### 1. Embeddings

* Convert text → vector
* Used for semantic similarity

---

### 2. Vector Search

* Finds similar meaning (not keywords)

---

### 3. Hybrid Search

* Combines:

  * keyword search
  * vector search

---

### 4. Chunking

* Split text into meaningful parts
* Critical for retrieval quality

---

### 5. vectorizer = none

* You must:

  * generate embeddings manually
  * pass vector in queries

---

## 🔍 Postman Testing

### Get objects:

```
GET /v1/objects?class=Documents
```

### With vectors:

```
GET /v1/objects?class=Documents&include=vector
```

---

## 🚨 Common Errors

| Error               | Fix                |
| ------------------- | ------------------ |
| port already in use | change port (8081) |
| ECONNREFUSED 50051  | expose gRPC port   |
| vectorizer error    | pass query vector  |
| empty context       | fix chunking       |
| duplicates          | reset collection   |

---

## 🎯 Final Outcome

You now have:

* ✅ Local RAG system
* ✅ No OpenAI dependency
* ✅ Semantic search
* ✅ LLM grounded answers

---

## 🚀 Next Improvements

* Query rewriting
* Chat memory
* Express API
* Multi-document ingestion
* Reranking

---

## 🧠 Summary

* Ollama → embeddings + LLM
* Weaviate → vector storage + retrieval
* Node.js → orchestration

---

**You now have a production-ready RAG foundation.**


run this command to remove the volumns of weaviate
docker volume rm weaviate_data