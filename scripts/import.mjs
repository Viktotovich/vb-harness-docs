// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 V and Bruno LLC
//
// Builds the docs pages from the harness repository, so the site never drifts from the README:
//   node scripts/import.mjs ../vb-harness-for-agentic-building
// It splits the README into pages, brings in the cookbook and the decisions log, copies the images, and rewrites
// links: README anchors point at the page that now holds the section, and repository files point at GitHub.
// Pages written here carry a "generated" comment; edit the harness repository, not them.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_URL = "https://github.com/Viktotovich/vb-harness-for-agentic-building";
const harness = process.argv[2];
if (!harness) { console.error("usage: node scripts/import.mjs <path to vb-harness-for-agentic-building>"); process.exit(1); }
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "src", "content", "docs");
const assets = join(root, "src", "assets", "media");
const pub = join(root, "public", "media");

// Which README sections make which page, in sidebar order within each group.
const PAGES = [
  { slug: "start/fastest-path", title: "Fastest path", sections: ["Fastest path"] },
  { slug: "start/how-it-works", title: "How it works", sections: ["How it works"] },
  { slug: "start/install", title: "Install", sections: ["Requirements", "Install"] },
  { slug: "start/the-app", title: "Quick start: the app", sections: ["Quick start: the app"] },
  { slug: "start/the-command-line", title: "Quick start: the command line", sections: ["Quick start: the command line"] },
  { slug: "guides/projects", title: "Projects and workspaces", sections: ["Projects and workspaces"] },
  { slug: "guides/understanding-a-run", title: "Understanding a run", sections: ["Understanding a run"] },
  { slug: "guides/configuration", title: "Configuration", sections: ["Configuration"] },
  { slug: "guides/choosing-a-model", title: "Choosing and checking a model", sections: ["Choosing and checking a model"] },
  { slug: "guides/using-with-claude", title: "Using with Claude", sections: ["Using with Claude"] },
  { slug: "guides/troubleshooting", title: "Troubleshooting", sections: ["Troubleshooting"] },
  { slug: "concepts/safety-model", title: "Safety model", sections: ["Safety model"] },
  { slug: "concepts/evaluation", title: "Evaluation", sections: ["Evaluation"] },
  { slug: "concepts/limitations", title: "Limitations", sections: ["Limitations"] },
  { slug: "concepts/why-ruby", title: "Why Ruby", sections: ["Why Ruby"] },
  { slug: "project/development", title: "Development and license", sections: ["Development", "License"] }
];
const FILES = [
  { slug: "cookbook/astro-landing-page", title: "An Astro landing page with a local model", file: "docs/cookbook/astro-landing-page.md", strip: ["**Contents**"] },
  { slug: "concepts/decisions", title: "Design decisions", file: "docs/decisions.md" }
];
// Sections that only make sense in the README itself.
const SKIP = ["Contents", "Cookbook: an Astro landing page"];
// Videos are served as they are; everything else goes through Astro's image pipeline.
const AS_IS = /\.(mp4|webm|webp)$/;

const githubSlug = (s) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");

function sections(md) {
  const out = [];
  let cur = null, fenced = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && line.match(/^## (.+)$/);
    if (m) { cur = { title: m[1].trim(), body: [] }; out.push(cur); continue; }
    if (cur) cur.body.push(line);
  }
  return out.map((s) => ({ ...s, body: s.body.join("\n").trim() }));
}

// README anchor (and cookbook ../../README.md#anchor) -> the page holding that section, plus its own anchor.
const anchorPage = new Map();
for (const p of PAGES) p.sections.forEach((t, i) => anchorPage.set(githubSlug(t), `/${p.slug}/${i === 0 ? "" : "#" + githubSlug(t)}`));
anchorPage.set(githubSlug("Cookbook: an Astro landing page"), "/cookbook/astro-landing-page/");

function rewrite(md, sourceDir, pageSlug) {
  const pageDir = join(docs, dirname(pageSlug));
  return md.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (all, bang, text, href) => {
    if (/^(https?:|mailto:)/.test(href)) return all;
    if (href.startsWith("#")) {
      // an anchor in the README moves with its section; anchors inside the cookbook or decisions stay put
      return sourceDir === "." && anchorPage.has(href.slice(1)) ? `${bang}[${text}](${anchorPage.get(href.slice(1))})` : all;
    }
    const [path, hash] = href.split("#");
    const repoPath = posix.normalize(posix.join(sourceDir, path));
    if (repoPath === "README.md") return `${bang}[${text}](${hash && anchorPage.has(hash) ? anchorPage.get(hash) : "/"})`;
    if (repoPath === "docs/cookbook/astro-landing-page.md") return `${bang}[${text}](/cookbook/astro-landing-page/)`;
    if (repoPath === "docs/decisions.md") return `${bang}[${text}](/concepts/decisions/)`;
    if (repoPath.startsWith("docs/media/")) {
      const name = repoPath.slice("docs/media/".length);
      if (AS_IS.test(name)) return `${bang}[${text}](/media/${name})`;
      return `${bang}[${text}](${relative(pageDir, join(assets, name)).split("\\").join("/")})`;
    }
    const kind = statSync(join(harness, repoPath), { throwIfNoEntry: false })?.isDirectory() ? "tree" : "blob";
    return `${bang}[${text}](${REPO_URL}/${kind}/main/${repoPath}${hash ? "#" + hash : ""})`;
  });
}

// The first sentence of the first plain paragraph, without Markdown, for the page description.
function describe(md) {
  const para = md.split(/\n\s*\n/).find((p) => /^[A-Za-z*`[]/.test(p.trim()) && !p.trim().startsWith("!["));
  const plain = (para || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`_]/g, "").replace(/\s+/g, " ").trim();
  return (plain.match(/^.*?[.!?](\s|$)/)?.[0] || plain).trim().replace(/"/g, "'");
}

function write(slug, title, body, order, source) {
  const file = join(docs, `${slug}.md`);
  mkdirSync(dirname(file), { recursive: true });
  const front = `---\ntitle: "${title.replace(/"/g, "'")}"\ndescription: "${describe(body)}"\nsidebar:\n  order: ${order}\n---\n`;
  writeFileSync(file, `${front}\n<!-- Generated by scripts/import.mjs from ${source} in the harness repository. Edit it there. -->\n\n${body}\n`);
  console.log("wrote", relative(root, file));
}

function copyTree(from, to, filter) {
  for (const name of readdirSync(from)) {
    const src = join(from, name), dst = join(to, name);
    if (statSync(src).isDirectory()) { copyTree(src, dst, filter); continue; }
    if (!filter(name)) continue;
    mkdirSync(to, { recursive: true });
    copyFileSync(src, dst);
  }
}

// --- run
const readme = readFileSync(join(harness, "README.md"), "utf8");
const bySection = new Map(sections(readme).filter((s) => !SKIP.includes(s.title)).map((s) => [s.title, s.body]));
PAGES.forEach((p, i) => {
  const parts = p.sections.map((t, j) => {
    const body = bySection.get(t);
    if (body === undefined) throw new Error(`README has no section "## ${t}"`);
    return j === 0 ? body : `## ${t}\n\n${body}`;
  });
  write(p.slug, p.title, rewrite(parts.join("\n\n"), ".", p.slug), i + 1, "README.md");
});
FILES.forEach((f, i) => {
  let md = readFileSync(join(harness, f.file), "utf8").replace(/<!--[\s\S]*?-->\s*/g, "").replace(/^# .+\n+/, "");
  for (const marker of f.strip || []) md = md.replace(new RegExp(`${marker.replace(/\*/g, "\\*")}\\n[\\s\\S]*?(?=\\n## )`), "");
  write(f.slug, f.title, rewrite(md.trim(), posix.dirname(f.file), f.slug), 100 + i, f.file);
});
rmSync(assets, { recursive: true, force: true });
rmSync(pub, { recursive: true, force: true });
copyTree(join(harness, "docs", "media"), assets, (n) => !AS_IS.test(n));
copyTree(join(harness, "docs", "media"), pub, (n) => AS_IS.test(n) || n === "demo-poster.png");
console.log("copied media");
