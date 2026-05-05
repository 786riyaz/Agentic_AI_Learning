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
    limit: 10,
    includeVector: true, // 🔥 IMPORTANT
  });

  console.log("All stored objects with vectors ====>");
  console.log(JSON.stringify(all, null, 2));

  console.log(
    "\n📦 Stored Data :::",
    all.objects.map((o) => o.properties.text),
  );

  // ✅ FIX: generate query embedding
  const queryVector = await getEmbedding(query);

  // ✅ FIX: pass vector explicitly
  const result = await collection.query.hybrid(query, {
    vector: queryVector,
    alpha: 0.7,
    limit: 3,
    // limit: 1,
  });

  const result1 = await collection.query.nearVector(queryVector, {
  limit: 1
});

  console.log("\n🔍 RAW RESULT:", JSON.stringify(result, null, 2));

  const context = result.objects.map((o) => o.properties.text).join("\n");

  console.log("\n📚 Retrieved Context:");
  console.log(context);

  const prompt = `
Context:
${context}

Question:
${query}

Answer clearly and concisely based on the above context. If the answer is not present in the context, say "I don't know". the answer should be professinal and jolly nature.:
`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false,
  });

  console.log("\n🧠 Final Answer ====>");
  console.log(res.data.response);
}

// ask("Who is the CEO of OpenAI?");
// ask("Who is Virat Kohli?");
// ask("Who is mister dhoni?");
ask("Who is the best finisher in Indian cricket?")
// ask("Who is the captain of Indian cricket team?");

/*
All stored objects with vectors ====>
{
  "objects": [
    {
      "metadata": {},
      "properties": {
        "text": "Virat Kohli is an Indian cricketer and former captain of the Indian national team. He is known for his aggressive batting style.",
        "source": "docs.txt"
      },
      "uuid": "94654c5a-822d-40e1-bb4e-4d80a0b5d95d",
      "vectors": {}
    },
    {
      "metadata": {},
      "properties": {
        "text": "Rohit Sharma is an Indian cricketer and the current captain of the Indian team in limited overs formats. He is known for his elegant batting.",
        "source": "docs.txt"
      },
      "uuid": "b433ae00-017f-4733-acfa-3249287c4d46",
      "vectors": {}
    },
    {
      "metadata": {},
      "properties": {
        "text": "MS Dhoni is a former Indian cricket team captain. He is known for his calm leadership and finishing ability.",
        "source": "docs.txt"
      },
      "uuid": "f6a8fd61-f5e6-47c9-b88a-687a26f59d60",
      "vectors": {}
    }
  ]
}

📦 Stored Data ::: [
  'Virat Kohli is an Indian cricketer and former captain of the Indian national team. He is known for his aggressive batting style.',
  'Rohit Sharma is an Indian cricketer and the current captain of the Indian team in limited overs formats. He is known for his elegant batting.',
  'MS Dhoni is a former Indian cricket team captain. He is known for his calm leadership and finishing ability.'
]

🔍 RAW RESULT: {
  "objects": [
    {
      "metadata": {},
      "properties": {
        "text": "MS Dhoni is a former Indian cricket team captain. He is known for his calm leadership and finishing ability.",
        "source": "docs.txt"
      },
      "uuid": "f6a8fd61-f5e6-47c9-b88a-687a26f59d60",
      "vectors": {}
    },
    {
      "metadata": {},
      "properties": {
        "source": "docs.txt",
        "text": "Virat Kohli is an Indian cricketer and former captain of the Indian national team. He is known for his aggressive batting style."
      },
      "uuid": "94654c5a-822d-40e1-bb4e-4d80a0b5d95d",
      "vectors": {}
    },
    {
      "metadata": {},
      "properties": {
        "text": "Rohit Sharma is an Indian cricketer and the current captain of the Indian team in limited overs formats. He is known for his elegant batting.",
        "source": "docs.txt"
      },
      "uuid": "b433ae00-017f-4733-acfa-3249287c4d46",
      "vectors": {}
    }
  ]
}

📚 Retrieved Context:
MS Dhoni is a former Indian cricket team captain. He is known for his calm leadership and finishing ability.
Virat Kohli is an Indian cricketer and former captain of the Indian national team. He is known for his aggressive batting style.
Rohit Sharma is an Indian cricketer and the current captain of the Indian team in limited overs formats. He is known for his elegant batting.

🧠 Final Answer ====>
The question that sparks debate among cricket enthusiasts! Based on the given context, I'd say MS Dhoni is widely regarded as the best finisher in Indian cricket. His calm leadership and exceptional finishing ability have made him a legend of the game. He has consistently shown an uncanny knack for closing out matches with his cool head and clinical strokeplay. While both Virat Kohli and Rohit Sharma are excellent batsmen, Dhoni's expertise in this area is unparalleled.

*/