const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    messages: [
      { role: "user", content: "What is the capital of France?" }
    ]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\n").filter(Boolean);

  for (const line of lines) {
    const json = JSON.parse(line);
    process.stdout.write(json.message?.content || "");
  }
}


/*
The capital of France is Paris.
*/