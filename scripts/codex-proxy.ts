import OpenAI from "openai";
import { execSync } from "child_process";

// Configuration from environment variables
const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: baseURL,
  apiKey: apiKey,
});

async function run() {
  const prompt = process.argv[2] || "Help me code";
  
  console.log(`--- Bedrock Proxy ---`);
  console.log(`Model: openai.gpt-oss-120b`);
  console.log(`Prompt: ${prompt}\n`);

  try {
    const stream = await client.chat.completions.create({
      model: "openai.gpt-oss-120b",
      messages: [
        { role: "system", content: "You are a senior software engineer and coding assistant. You have access to a shell tool to explore and modify the codebase. Always explain your rationale before running commands." },
        { role: "user", content: prompt }
      ],
      tools: [{
        type: "function",
        function: {
          name: "shell",
          description: "Execute a bash command in the project workspace",
          parameters: {
            type: "object",
            properties: {
              command: { type: "string", description: "The bash command to run" }
            },
            required: ["command"]
          }
        }
      }],
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        process.stdout.write(delta.content);
      }
      
      if (delta?.tool_calls) {
        for (const call of delta.tool_calls) {
          if (call.function?.arguments) {
            // In a real proxy we would handle partial JSON, but for this test we wait for completion
            // Note: streaming tool calls can be tricky.
          }
        }
      }
    }
    console.log("\n\n--- Done ---");
  } catch (error: any) {
    console.error("\nAPI Error:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
