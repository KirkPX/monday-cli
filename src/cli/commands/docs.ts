import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, parse, resolve, sep } from "node:path";
import { ApiError, ConfigError, UsageError, fileErrorReason } from "../../errors.js";
import { getAllDocs, getAllFolders } from "../../monday-api.js";
import { sanitizeFilename } from "../../utils.js";
import { createClient } from "../client-helpers.js";
import { confirmDestructive, reportAbort } from "../guardrails.js";
import { reporter } from "../output.js";
import type { MutationOpts } from "../types.js";

const DOCS_LIMIT = 500;

export async function docsCommand(opts: MutationOpts & { output?: string } = {}): Promise<void> {
  const r = reporter(opts);
  const outputDir = resolve(opts.output || join(process.cwd(), "monday_docs"));
  refuseUnsafeFolder(outputDir);

  // The folder is replaced, so anything already in it would be lost.
  if (hasFiles(outputDir)) {
    const answer = await confirmDestructive(`Replace everything in ${outputDir}?`, opts);
    if (!answer.confirmed) {
      reportAbort(r, answer.reason, `Did not change ${outputDir}.`);
      return;
    }
  }

  const client = createClient(opts);
  r.note("Fetching all documents...");
  const docs = await getAllDocs(client);
  if (docs.length === DOCS_LIMIT) {
    r.warn(`Monday returned ${DOCS_LIMIT} documents, the most one request can read. There may be more.`);
  }

  r.note("Fetching folders...");
  const folderMap = new Map<string, any>();
  try {
    for (const folder of await getAllFolders(client)) folderMap.set(folder.id, folder);
  } catch (error) {
    // Folders only choose where each file goes, so a token without that scope can
    // still export every document.
    if (!(error instanceof ApiError)) throw error;
    r.warn(`Could not read folders, so documents go under Uncategorized: ${error.message}`);
  }
  r.note(`Found ${folderMap.size} folders and ${docs.length} documents`);

  try {
    if (existsSync(outputDir)) rmSync(outputDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    throw new ConfigError(`Cannot write to ${outputDir}: ${fileErrorReason(error)}.`);
  }

  let count = 0;
  const failed: Array<{ id: unknown; name: unknown; reason: string }> = [];
  for (const doc of docs) {
    try {
      const workspaceName = doc.workspace?.name || "Unknown";
      const folder = doc.doc_folder_id ? folderMap.get(doc.doc_folder_id) : null;
      const folderName = folder?.name || "Uncategorized";
      const docDir = join(outputDir, sanitizeFilename(workspaceName), sanitizeFilename(folderName));
      mkdirSync(docDir, { recursive: true });

      const filename = sanitizeFilename(doc.name || "Untitled") + ".md";
      writeFileSync(join(docDir, filename), createMarkdownDoc(doc, folderName), "utf-8");
      count++;
      r.note(`  Saved: ${workspaceName}/${folderName}/${filename}`);
    } catch (error) {
      const reason = fileErrorReason(error);
      failed.push({ id: doc.id, name: doc.name, reason });
      r.warn(`Could not save document "${doc.name}": ${reason}`);
    }
  }

  r.result(
    { directory: outputDir, saved: count, total: docs.length, failed },
    `Saved ${count} of ${docs.length} documents to ${outputDir}`
  );
  if (failed.length > 0) process.exitCode = 1;
}

function hasFiles(dir: string): boolean {
  try {
    return readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

/** This command empties its folder. It must never be a folder that holds other work. */
function refuseUnsafeFolder(dir: string): void {
  const cwd = process.cwd();
  if (dir === parse(dir).root || dir === homedir() || cwd === dir || cwd.startsWith(dir + sep)) {
    throw new UsageError(`Refusing to replace ${dir}.`, "Pass --output with a folder only for these documents.");
  }
}

function createMarkdownDoc(doc: any, folderName?: string): string {
  const workspace = doc.workspace;
  const workspaceName = workspace?.name || 'Unknown';
  const creatorName = doc.created_by?.name || 'Unknown';
  const createdAt = doc.created_at || 'Unknown';

  let md = `---
title: ${doc.name || 'Untitled'}
workspace: ${workspaceName}
folder: ${folderName || 'None'}
creator: ${creatorName}
created_date: ${createdAt}
doc_id: ${doc.id || ''}
---

# ${doc.name || 'Untitled'}

`;

  const blocks = (doc.blocks || []).sort((a: any, b: any) =>
    (a.position || 0) - (b.position || 0)
  );

  for (const block of blocks) {
    md += convertBlockToMarkdown(block);
  }

  return md;
}

function convertBlockToMarkdown(block: any): string {
  const blockType = block.type || '';
  let content = block.content;

  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { return ''; }
  }
  if (!content) return '';

  const delta = content.deltaFormat || [];

  function extractText(deltaFormat: any[]): string {
    if (!deltaFormat || !Array.isArray(deltaFormat)) return '';

    return deltaFormat
      .filter((item: any) => item && typeof item === 'object' && 'insert' in item)
      .map((item: any) => {
        const insert = item.insert;
        if (typeof insert === 'object') return '';

        let text = String(insert);
        const attrs = item.attributes || {};

        if (attrs.bold) text = `**${text}**`;
        if (attrs.italic) text = `*${text}*`;
        if (attrs.underline) text = `<u>${text}</u>`;
        if (attrs.code) text = `\`${text}\``;
        if (attrs.strike) text = `~~${text}~~`;

        return text;
      })
      .join('');
  }

  switch (blockType) {
    case 'large_title':
      return `# ${extractText(delta)}\n\n`;
    case 'medium_title':
      return `## ${extractText(delta)}\n\n`;
    case 'small_title':
      return `### ${extractText(delta)}\n\n`;
    case 'normal_text':
      return `${extractText(delta)}\n\n`;
    case 'bulleted_list': {
      const indent = '  '.repeat(content.indentation || 0);
      return `${indent}- ${extractText(delta)}\n`;
    }
    case 'numbered_list': {
      const indent = '  '.repeat(content.indentation || 0);
      return `${indent}1. ${extractText(delta)}\n`;
    }
    case 'check_list': {
      const checked = content.checked ? '[x]' : '[ ]';
      const indent = '  '.repeat(content.indentation || 0);
      return `${indent}- ${checked} ${extractText(delta)}\n`;
    }
    case 'quote':
      return `> ${extractText(delta)}\n\n`;
    case 'code':
      return `\`\`\`${content.language || ''}\n${extractText(delta)}\n\`\`\`\n\n`;
    case 'divider':
      return '---\n\n';
    case 'image': {
      if (content.url) return `![Image](${content.url})\n\n`;
      if (content.assetId) return `![Image](monday-asset://${content.assetId})\n\n`;
      return '';
    }
    case 'video':
      return content.url ? `[Video: ${content.url}](${content.url})\n\n` : '';
    case 'notice_box': {
      const theme = (content.theme || 'general').toUpperCase();
      return `> **${theme}**: ${extractText(delta)}\n\n`;
    }
    case 'table':
      return `[Table: ${content.rowCount || 0}x${content.columnCount || 0}]\n\n`;
    default: {
      const text = extractText(delta);
      return text ? `${text}\n\n` : '';
    }
  }
}
