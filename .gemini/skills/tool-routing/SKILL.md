---
name: tool-routing
description: Expert procedural guidance for selecting and orchestrating the right tools for a task.
---

Expert procedural guidance for selecting and orchestrating the right tools for a task.

## Instructions
- Evaluate the task requirements against available tool capabilities.
- Prefer specialized tools (e.g., `grep_search`) over general ones (`read_file`) for discovery.
- Use parallel tool execution for independent sub-tasks to save time.
- Chain tools logically, ensuring the output of one is correctly passed to the next.
- Delegate complex or repetitive tasks to specialized sub-agents.
