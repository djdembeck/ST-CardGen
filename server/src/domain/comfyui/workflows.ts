import fs from "node:fs/promises";
import path from "node:path";

const WORKFLOWS_DIR = path.resolve(process.cwd(), "workflows");
const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

type WorkflowInfo = { name: string; title: string; hasLora: boolean };

function hasLoraNode(workflow: Record<string, any>) {
  return Object.values(workflow).some((node: any) => node?.class_type === "LoraLoader");
}

function ensureSafeName(name: string) {
  if (!SAFE_NAME.test(name) || !name.endsWith(".json")) {
    throw new Error("Invalid workflow name");
  }
  return name;
}

export async function listWorkflows(): Promise<WorkflowInfo[]> {
  const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
  const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
  const workflows: WorkflowInfo[] = [];

  for (const file of jsonFiles) {
    const fullPath = path.join(WORKFLOWS_DIR, file.name);
    try {
      const raw = await fs.readFile(fullPath, "utf-8");
      const parsed = JSON.parse(raw);
      workflows.push({
        name: file.name,
        title: file.name,
        hasLora: hasLoraNode(parsed),
      });
    } catch {
      // ignore invalid files
    }
  }

  workflows.sort((a, b) => a.name.localeCompare(b.name));
  return workflows;
}

export async function loadWorkflow(name: string): Promise<any> {
  const safe = ensureSafeName(name);
  const fullPath = path.join(WORKFLOWS_DIR, safe);
  const raw = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(raw);
}

export async function loadBindingsForWorkflow(name: string): Promise<Record<string, any>> {
  const safe = ensureSafeName(name);
  const base = path.basename(safe, ".json");
  const bindingsPath = path.join(WORKFLOWS_DIR, `${base}.bindings.json`);
  try {
    const raw = await fs.readFile(bindingsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    const fallback = path.join(WORKFLOWS_DIR, "sd_basic.bindings.json");
    const raw = await fs.readFile(fallback, "utf-8");
    return JSON.parse(raw);
  }
}
