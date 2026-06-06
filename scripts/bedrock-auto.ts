import OpenAI from "openai";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const client = new OpenAI();
const model = process.env.OPENAI_MODEL || "openai.gpt-5.5";

async function runAuto(task: string) {
  console.log("🤖 Task:", task);
  console.log("🤖 Model:", model);

  try {
    const stream = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a coding agent. When you need to run a command, output: RUN_COMMAND: the_command_here. When you need to write a file, output: WRITE_FILE: path/to/file\n---\nfile_content\n---END---`
        },
        { role: "user", content: task }
      ],
      stream: true,
      temperature: 0.2
    });

    let buffer = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      buffer += text;
      process.stdout.write(text);
    }

    // Parse commands
    const cmdMatches = buffer.matchAll(/RUN_COMMAND: (.*?)\n/g);
    for (const match of cmdMatches) {
      const cmd = match[1].trim();
      console.log(`\n⚡ Executing: ${cmd}`);
      try {
        const out = execSync(cmd, { encoding: "utf-8" });
        console.log(out);
      } catch (e: any) {
        console.error("Error:", e.message);
      }
    }

    // Parse file writes
    const fileMatches = buffer.matchAll(/WRITE_FILE: (.*?)\n---\n([\s\S]*?)\n---END---/g);
    for (const match of fileMatches) {
      const [, filepath, content] = match;
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filepath, content.trim());
      console.log(`\n📝 Wrote: ${filepath}`);
    }
  } catch (error: any) {
    console.error("\n❌ API Error:", error.message);
  }
}

runAuto(process.argv[2] || "Help me code").catch(console.error);
