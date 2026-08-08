# Luna

Luna is JumpServer's Web Terminal project,
built primarily with [Angular](https://angular.io/) and [Material](https://material.angular.io/),
its name comes from the Dota hero [Luna](https://www.dota2.com/hero/luna)

## Development

```
0. Prerequisite: have a running JumpServer API server

1. Install dependencies
$ npm install

2. Run
$ npm run start

3. Build
$ rm -fr luna
$ npm run-script build
```

## Production deployment

Download the RELEASE file, place it in the appropriate directory, and set up the nginx config file as follows:

```
  location /luna/ {
    try_files $uri / /index.html;
    alias /path/of/your/luna/;
  }
```

## License & Copyright

Be consistent with [jumpserver](https://github.com/jumpserver/jumpserver)

## Repository Layout

This repo builds the `luna` image consumed by [js-installer](https://github.com/matheus-marques-ft/js-installer)'s `compose/web.yml` (bundled into the final `web` image by [js-docker-web](https://github.com/matheus-marques-ft/js-docker-web) alongside [js-lina](https://github.com/matheus-marques-ft/js-lina)). Luna is JumpServer's end-user web terminal — the interface a regular user connects through to reach an SSH/RDP/database asset from the browser.

- **`src/app/pages/`** — top-level routed pages: `connect` (the main terminal workspace), `replay` (session recording playback), `direct` (direct-connect entrypoint).
- **`src/app/elements/`** — the workspace UI building blocks: `connect` (asset-tree + connect dialog), `content` (tabbed session windows, one per open connection — `content-window` dispatches to protocol-specific sub-components like `koko`/`magnus`/`nec`), `nav`/`left-bar` (chrome), `replay/*` (per-format session player: `asciicast`, `guacamole`, `mp4`, `parts`), `chat` (AI assistant panel).
- **`src/app/services/`** — cross-cutting app services: `http.ts` (API client), `app.ts` (global app state), `setting.ts` (server-provided settings), `i18n.ts` (thin wrapper over `ngx-translate`), `connect-token/` (connect-token/ACL flow), `face.ts` (facial-recognition MFA), `drawer.ts`, `crypto.ts`.
- **`src/assets/i18n/`** — `ngx-translate` locale catalogs (`en.json`, `zh-hans.json`, `zh-hant.json`, `ja.json`); copied into the built `dist/luna/` output at image-build time (see `Dockerfile`) rather than bundled by the Angular build itself.
- **`Dockerfile-base`** / **`Dockerfile`** — two-stage build: `Dockerfile-base` installs Node dependencies (published as the `luna-base` image, rebuilt only when `package.json`/`yarn.lock` change); `Dockerfile` builds the Angular app on top of that base, stamps in the version, and copies the output into an nginx image.

### CI → GHCR mapping

| Workflow | Publishes |
|---|---|
| `build-base-image.yml` | `ghcr.io/matheus-marques-ft/luna-base:<timestamp>` — triggered by `package.json`/`yarn.lock`/`Dockerfile-base` changes on `pr*` branches, then auto-commits the new tag into `Dockerfile` |
| `build-release-image.yml` | `ghcr.io/matheus-marques-ft/luna:<tag>` (and `:latest`) — triggered on `v*` tags |
| `release-drafter.yml` | drafts a GitHub Release with a `luna-<tag>.tar.gz` build artifact — triggered on `v*` tags |
