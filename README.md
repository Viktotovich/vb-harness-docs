<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 V and Bruno LLC -->

# vb-harness-docs

The documentation site for [vb-harness-for-agentic-building](https://github.com/Viktotovich/vb-harness-for-agentic-building),
published at **https://vb-harness.vandbruno.net**. It is an [Astro Starlight](https://starlight.astro.build/) site,
themed like the harness app: dark, Inter, and the app's violet.

It lives in its own repository because it needs npm, and the harness itself has no dependencies.

## Run it

```bash
npm install
npm run dev
```

`npm run build` writes the static site to `dist/`.

## Where the pages come from

Most pages are generated from the harness repository, so the site does not drift from the README:

```bash
node scripts/import.mjs ../vb-harness-for-agentic-building
```

The script splits the harness README into pages, brings in `docs/cookbook/` and `docs/decisions.md`, copies
`docs/media/`, and rewrites links: README anchors point at the page that now holds the section, and repository
files point at GitHub. Generated pages say so at the top; change those in the harness repository and import again.

Written here, not generated: the home page (`src/content/docs/index.mdx`), "Need help?"
(`src/content/docs/need-help.md`), the theme (`src/styles/`) and the component overrides (`src/components/`).

## Deploying

The site is static. On Cloudflare Pages or GitHub Pages, build with `npm run build` and publish `dist/`.
`public/CNAME` holds the custom domain for GitHub Pages.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
