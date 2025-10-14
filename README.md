# Top Image Title generator

Basic top image title generator made with [plugma](https://plugma.dev)

Bun installation (powershell):
```pwsh
powershell -c "irm bun.sh/install.ps1|iex"
```

## Building

1. clone the repo ([figma--top-image-title-generator](https://github.com/kkazzann/figma--top-image-title-generator))
3. run "pnpm install" or "bun install"
4. run "pnpm build" or "bun run build"
5. code is bundled inside /dist/ -> main.js, manifest.js, index.html

## Installation

1. Open Figma **(Desktop version)** - [download here](https://www.figma.com/download/desktop/win), open any design file eg. copy of newsletter project.
2. Open the menu in the top-left corner (figma logo).
3. Follow this path: **Plugins** > **Development** > **Import plugin from manifest...**
4. Select TIT Generator's **manifest.json**
5. Plugin should be ready to use.
