import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "artifacts", "independent-audit");
await mkdir(OUT, { recursive: true });
async function json(name) { try { return JSON.parse(await readFile(path.join(OUT, name), "utf8")); } catch { return null; } }
async function text(name) { try { return await readFile(path.join(OUT, name), "utf8"); } catch { return ""; } }
const staticAudit = await json("static.json");
const databaseAudit = await json("database.json");
const browserAudit = await json("browser.json");
const commandText = await text("commands.tsv");
const commands = commandText.trim().split(/\r?\n/).filter(Boolean).map((line) => {
  const [name, code] = line.split("\t"); return { name, exitCode: Number(code), status: Number(code) === 0 ? "PASS" : "FAIL" };
});

const findings = [];
for (const [source, report] of [["static", staticAudit], ["database", databaseAudit], ["browser", browserAudit]]) {
  for (const finding of report?.findings ?? []) findings.push({ source, ...finding });
}
for (const command of commands.filter((c) => c.status === "FAIL")) findings.push({ source: "generic-command", severity: command.name.includes("audit") ? "high" : "critical", category: "command-failure", route: command.name, message: `${command.name} exited with ${command.exitCode}.`, evidence: `artifacts/independent-audit/${command.name}.log` });
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
findings.sort((a,b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9) || String(a.source).localeCompare(String(b.source)));
const counts = Object.fromEntries(["critical","high","medium","low","info"].map((s) => [s, findings.filter((f) => f.severity === s).length]));
const confirmedBlocking = findings.filter((f) => ["critical","high"].includes(f.severity));
const cleanupCandidates = findings.filter((f) => ["low","info"].includes(f.severity) || /candidate|complexity|temporary-copy|duplicate-code/.test(f.category ?? ""));
const verdict = confirmedBlocking.length === 0 ? "NO_BLOCKING_DEFECTS_FOUND" : "DEFECTS_FOUND";
const report = {
  auditedAt: new Date().toISOString(),
  auditedSha: process.env.GITHUB_SHA ?? null,
  verdict,
  counts,
  genericCommands: commands,
  staticMetrics: staticAudit?.metrics ?? null,
  databaseCheckpoints: databaseAudit?.checkpoints ?? [],
  browserRouteInventory: browserAudit?.routeInventory ?? null,
  browserCheckpoints: browserAudit?.checkpoints ?? [],
  findings,
  cleanupCandidates
};
await writeFile(path.join(OUT, "FINAL-AUDIT.json"), JSON.stringify(report, null, 2));
let md = `# Independent Full-System Audit\n\n- Audited SHA: \`${report.auditedSha ?? "unknown"}\`\n- Verdict: **${verdict}**\n- Critical: ${counts.critical}\n- High: ${counts.high}\n- Medium: ${counts.medium}\n- Low: ${counts.low}\n- Informational/dead-code candidates: ${counts.info}\n\n## Generic engineering checks\n\n${commands.map((c) => `- ${c.status === "PASS" ? "✅" : "❌"} ${c.name} (exit ${c.exitCode})`).join("\n") || "No command results were recorded."}\n\n## Database checkpoints\n\n${(databaseAudit?.checkpoints ?? []).map((c) => `- ${c.status === "PASS" ? "✅" : "❌"} ${c.name}${c.error ? ` — ${c.error}` : ""}`).join("\n")}\n\n## Browser checkpoints\n\n${(browserAudit?.checkpoints ?? []).map((c) => `- ${c.status === "PASS" ? "✅" : "❌"} ${c.name}${c.error ? ` — ${c.error}` : ""}`).join("\n")}\n\n## Complete finding ledger\n\n`;
md += findings.length ? findings.map((f,i) => `${i+1}. **${String(f.severity).toUpperCase()} — ${f.source}/${f.category}** — ${f.file ? `\`${f.file}:${f.line ?? 1}\`` : f.route ? `\`${f.route}\`` : ""} — ${f.message}${f.evidence ? ` — evidence: \`${typeof f.evidence === "string" ? f.evidence.replaceAll("`", "'") : JSON.stringify(f.evidence).replaceAll("`", "'")}\`` : ""}`).join("\n") : "No findings.\n";
md += `\n\n## Dead / extra / cleanup candidates\n\n${cleanupCandidates.length ? cleanupCandidates.map((f,i) => `${i+1}. ${f.file ?? f.route ?? f.category}: ${f.message}`).join("\n") : "No cleanup candidates were identified by the conservative scanner."}\n`;
await writeFile(path.join(OUT, "FINAL-AUDIT.md"), md);
console.log(JSON.stringify({ verdict, counts, commands, blocking: confirmedBlocking.length, cleanupCandidates: cleanupCandidates.length }, null, 2));
