import fetch from "node-fetch";

console.log(
  "======================================================================",
);

const msg1 = "What is the capital of France?";
const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    stream: false, // ✅ IMPORTANT FIX
    messages: [{ role: "user", content: msg1 }],
  }),
});

const data = await response.json();
console.log("User :: ", msg1);
console.log("Assistant :: ", data.message.content);
console.log(
  "======================================================================",
);

const msg2 = "What is the capital of Germany?";
const response1 = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    stream: false, // ✅ IMPORTANT FIX
    messages: [{ role: "user", content: msg2 }],
  }),
});

const data1 = await response1.json();
console.log("User :: ", msg2);
console.log("Assistant :: ", data1.message.content);
console.log(
  "======================================================================",
);

const msg3 = "What is the capital of Japan?";
const response2 = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    stream: false, // ✅ IMPORTANT FIX
    messages: [{ role: "user", content: msg3 }],
  }),
});

const data2 = await response2.json();
console.log("User :: ", msg3);
console.log("Assistant :: ", data2.message.content);

console.log(
  "======================================================================",
);
