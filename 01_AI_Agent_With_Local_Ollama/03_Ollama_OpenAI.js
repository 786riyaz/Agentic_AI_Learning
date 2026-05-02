import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1", // this is better that chat api
  apiKey: "ollama", // dummy
});

const msg1 = "Hello!";
const response = await client.chat.completions.create({
  model: "llama3",
  messages: [{ role: "user", content: msg1 }],
});

console.log(
  "=========================================================================================================",
);
console.log("User :: " + msg1);
console.log("Assistant :: " + response.choices[0].message.content);

console.log(
  "=========================================================================================================",
);
const msg2 = "What is the capital of India?";
const response1 = await client.chat.completions.create({
  model: "llama3",
  messages: [{ role: "user", content: msg2 }],
});

console.log("User :: " + msg2);
console.log("Assistant :: " + response1.choices[0].message.content);

console.log(
  "=========================================================================================================",
);
const msg3 = "Kese ho aap ? (Reply in Hindi)";
const response2 = await client.chat.completions.create({
  model: "llama3",
  messages: [{ role: "user", content: msg3 }],
});

console.log("User :: " + msg3);
console.log("Assistant :: " + response2.choices[0].message.content);
console.log(
  "=========================================================================================================",
);



/*
=========================================================================================================
User :: Hello!
Assistant :: Hello! It's nice to meet you. Is there something I can help you with, or would you like to chat?
=========================================================================================================
User :: What is the capital of India?
Assistant :: The capital of India is New Delhi.
=========================================================================================================
User :: Kese ho aap ? (Reply in Hindi)
Assistant :: Thik hai! Aap kaise ho? (Translation: I'm fine! How are you?)
=========================================================================================================
*/