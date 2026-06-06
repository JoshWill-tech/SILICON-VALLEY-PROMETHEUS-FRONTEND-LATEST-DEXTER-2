import OpenAI from "openai";
import { execSync } from "child_process";
import * as readline from "readline";

const client = new OpenAI();
const model = process.env.OPENAI_MODEL || "openai.gpt-5.5";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer));
  });
}

async function runAgent() {
  const userPrompt = process.argv[2] || await ask("Task: ");

  console.log("\n🤖 Bedrock Agent running...\n");
  console.log("🤖 Model:", model, "\n");

  try {
    const stream = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a senior software engineer. You can run shell commands by outputting them in a code block with language "bash". You can write files by outputting them in a code block with a filename comment like "// filename: path/to/file".`
        },
        { role: "user", content: userPrompt }
      ],
      stream: true,
      temperature: 0.2
    });

    let buffer = "";
    let currentBlock = "";
    let inBashBlock = false;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      process.stdout.write(content);
      
      if (content.includes("```bash")) {
        inBashBlock = true;
        currentBlock = "";
        continue;
      }
      
      if (inBashBlock) {
        if (content.includes("```")) {
          inBashBlock = false;
          const cmd = currentBlock.trim();
          if (cmd) {
            console.log("\n");
            const answer = await ask(`⚡ Run: ${cmd} ? [y/n] `);
            if (answer.toLowerCase() === "y") {
              try {
                const result = execSync(cmd, { encoding: "utf-8", cwd: process.cwd() });
                console.log("\n✅ Output:\n", result);
              } catch (e: any) {
                console.error("\n❌ Error:", e.stderr || e.message);
              }
            }
          }
          currentBlock = "";
        } else {
          currentBlock += content;
        }
      }
    }
  } catch (error: any) {
    console.error("\n❌ API Error:", error.message);
  }

  rl.close();
  console.log("\n\n✅ Done");
}

runAgent().catch(console.error);
