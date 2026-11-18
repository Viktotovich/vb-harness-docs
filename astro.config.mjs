// @ts-check
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 V and Bruno LLC
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const REPO = "https://github.com/Viktotovich/vb-harness-for-agentic-building";

export default defineConfig({
  site: "https://vb-harness.vandbruno.net",
  integrations: [
    starlight({
      title: "VB Harness",
      description: "Real coding work from a local model: small tasks, your project's own checks, and an evidence-gated review.",
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: REPO }],
      customCss: ["./src/styles/fonts.css", "./src/styles/theme.css"],
      components: {
        // The harness app is dark only, and so is its documentation.
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
        Footer: "./src/components/Footer.astro"
      },
      expressiveCode: {
        themes: ["github-dark-default"],
        styleOverrides: { borderRadius: "4px", borderColor: "#2b2b33", codeBackground: "#16161a", frames: { editorTabBarBackground: "#0f0f12", terminalTitlebarBackground: "#0f0f12" } }
      },
      head: [
        { tag: "meta", attrs: { name: "theme-color", content: "#16151c" } },
        // The link preview for every page: the app at work, with the name and what it does.
        { tag: "meta", attrs: { property: "og:image", content: "https://vb-harness.vandbruno.net/og.png" } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        { tag: "meta", attrs: { property: "og:image:alt", content: "VB Harness: real coding work from a local model. The app building a blog task by task." } },
        { tag: "meta", attrs: { name: "twitter:image", content: "https://vb-harness.vandbruno.net/og.png" } }
      ],
      sidebar: [
        { label: "Getting started", items: [{ autogenerate: { directory: "start" } }] },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        { label: "Cookbook", items: [{ autogenerate: { directory: "cookbook" } }] },
        { label: "Concepts", items: [{ autogenerate: { directory: "concepts" } }] },
        { label: "Project", items: [{ slug: "project/development" }, { label: "Need help?", slug: "need-help" }] }
      ]
    })
  ]
});
