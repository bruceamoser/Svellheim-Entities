/**
 * Generate heroized versions of selected narrative NPCs through the local MCP server.
 *
 * Output is written non-destructively to ./output/heroized-npcs/ so the converted
 * actors can be reviewed before replacing curated npc pack sources.
 */
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const mcpRepoRoot = resolve(repoRoot, "..", "draw-steel-foundry-vtt-mcp");
const outputDir = join(repoRoot, "output", "heroized-npcs");
const configPath = join(__dirname, "npc-heroization-config.json");
const sdkClientPath = pathToFileURL(join(mcpRepoRoot, "node_modules", "@modelcontextprotocol", "sdk", "dist", "esm", "client", "index.js")).href;
const sdkStdioPath = pathToFileURL(join(mcpRepoRoot, "node_modules", "@modelcontextprotocol", "sdk", "dist", "esm", "client", "stdio.js")).href;

function extractTextContent(result) {
  return result.content?.find((entry) => entry.type === "text")?.text ?? "";
}

function extractSavedPath(text) {
  const match = text.match(/Saved to: (.+)/);
  if (!match) {
    throw new Error(`Could not parse saved file path from MCP response:\n${text}`);
  }
  return match[1].trim();
}

function mergeNarrativeFields(generated, original) {
  const merged = JSON.parse(JSON.stringify(generated));
  const originalBiography = original.system?.biography ?? {};
  const generatedBiography = merged.system?.biography ?? {};

  merged.name = original.name;
  merged.img = original.img;

  if (merged.prototypeToken?.texture) {
    merged.prototypeToken.name = original.prototypeToken?.name ?? original.name;
    merged.prototypeToken.texture.src = original.prototypeToken?.texture?.src ?? original.img;
    if (original.prototypeToken?.disposition !== undefined) {
      merged.prototypeToken.disposition = original.prototypeToken.disposition;
    }
  }

  merged.system.biography = {
    ...generatedBiography,
    value: originalBiography.value ?? generatedBiography.value ?? "",
    director: originalBiography.director ?? generatedBiography.director ?? "",
    languages: Array.isArray(originalBiography.languages) && originalBiography.languages.length > 0
      ? originalBiography.languages
      : (generatedBiography.languages ?? []),
  };

  merged.flags = {
    ...(merged.flags ?? {}),
    svellheim: {
      heroizedFrom: original.name,
      originalNpcFile: original.__sourceFile,
    },
  };

  return merged;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

try {
  await mkdir(outputDir, { recursive: true });

  const [{ Client }, { StdioClientTransport }] = await Promise.all([
    import(sdkClientPath),
    import(sdkStdioPath),
  ]);

  const config = await loadJson(configPath);
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    cwd: mcpRepoRoot,
    stderr: "pipe",
  });

  if (transport.stderr) {
    transport.stderr.on("data", (chunk) => process.stderr.write(chunk));
  }

  const client = new Client({ name: "svellheim-npc-heroizer", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  const summary = [];

  for (const entry of config) {
    const targetPath = join(outputDir, entry.outputFile);
    if (existsSync(targetPath)) {
      console.error(`  [SKIP] ${entry.outputFile} already exists`);
      continue;
    }

    const sourceNpcPath = join(repoRoot, entry.sourceNpcFile);
    const originalNpc = await loadJson(sourceNpcPath);
    originalNpc.__sourceFile = entry.sourceNpcFile;

    let responseText = null;
    let lastError = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const result = await client.callTool({
          name: "generate_random_hero_actor",
          arguments: {
            ancestry: entry.ancestry,
            culture: entry.culture,
            career: entry.career,
            heroClass: entry.heroClass,
            level: entry.level,
            seed: entry.seed + (attempt - 1) * 100,
            randomizeMissing: false,
            includeFaith: false,
            destination: "output",
          },
        });
        const text = extractTextContent(result);
        if (!text.includes("Saved to:")) {
          lastError = new Error(text.slice(0, 200));
          console.error(`  [RETRY ${attempt}/5] ${entry.outputFile}: validation error`);
          continue;
        }
        responseText = text;
        break;
      } catch (err) {
        lastError = err;
        console.error(`  [RETRY ${attempt}/5] ${entry.outputFile}: ${err.message}`);
      }
    }
    if (!responseText) {
      console.error(`  [FAIL] ${entry.outputFile}: exhausted retries — ${lastError?.message}`);
      summary.push({ name: entry.outputFile, error: lastError?.message });
      continue;
    }

    const generatedSourcePath = extractSavedPath(responseText);
    const generatedActor = await loadJson(generatedSourcePath);
    const mergedActor = mergeNarrativeFields(generatedActor, originalNpc);

    await writeFile(targetPath, JSON.stringify(mergedActor, null, 2));

    summary.push({
      name: originalNpc.name,
      sourceNpcFile: entry.sourceNpcFile,
      outputFile: targetPath,
      ancestry: entry.ancestry,
      culture: entry.culture,
      career: entry.career,
      heroClass: entry.heroClass,
      level: entry.level,
      seed: entry.seed,
      rationale: entry.rationale,
      responseText,
    });
  }

  await transport.close();
  await writeFile(join(outputDir, "_summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (err) {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
}