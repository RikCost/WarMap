# Running the War Map locally

This covers getting the development server up, what comes with it, and the
problems you are most likely to hit.

## Requirements

- [Node.js](https://nodejs.org/) with npm. The GitHub Pages build uses Node 12;
  newer versions work too, but need one extra flag (see below).
- Git

There is nothing else to set up: all the data lives in local `.json` files under
`src/assets/data`, so the site needs no network access once dependencies are
installed.

## First-time setup

```bash
npm install
```

`npm install` also runs the `prepare` script, which installs the husky
pre-commit hook (it runs prettier on staged files through lint-staged).

## Starting the dev server

### Node 16 or older

```bash
npm run serve
```

### Node 17 or newer

The project is built on Vue CLI 4 / webpack 4, which uses a hashing algorithm
that newer OpenSSL versions disable by default. Start the server with the
legacy OpenSSL provider enabled:

```bash
node --openssl-legacy-provider node_modules/@vue/cli-service/bin/vue-cli-service.js serve --port 8080
```

or set it through the environment and use the normal script:

```bash
NODE_OPTIONS=--openssl-legacy-provider npm run serve
```

(PowerShell: `$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run serve`)

Once it reports `Compiled successfully`, open http://localhost:8080.

## What is available

| Address                                    | What it is                                     |
| ------------------------------------------ | ---------------------------------------------- |
| `http://localhost:8080/#/`                 | The map                                        |
| `http://localhost:8080/#/?round=3&tile=c9` | The map, jumped to a round and tile            |
| `http://localhost:8080/#/stories`          | Character stories (`?fighter=<id>` opens one)  |
| `http://localhost:8080/#/items`            | Battle item tracker (`?item=<id>` focuses one) |
| `http://localhost:8080/#/chars`            | Character editor (admin, dev server only)      |
| `http://localhost:8080/#/pics`             | Profile picture framing tool (admin, dev only) |

The admin pages talk to a small Express server (`server/index.js`) that is
hooked into the dev server through `devServer.before` in `vue.config.js`. It
serves the `/server/...` endpoints and **writes directly to the data files in
`src/assets/data`** (backstories, pictures, artists, fighter names, merges), so
review `git diff` after using them. It only exists while the dev server runs;
the published site is fully static.

## Other commands

```bash
npm run build   # production build into dist/ (served under /WarMap/)
npm run lint    # eslint over the project
```

Add the same `--openssl-legacy-provider` flag to these on Node 17+ if they fail
with the OpenSSL error below.

Merges to `main` are built and published to GitHub Pages by
`.github/workflows/gh-pages.yml`.

## Troubleshooting

**`Error: error:0308010C:digital envelope routines::unsupported`
(`ERR_OSSL_EVP_UNSUPPORTED`)**
You are on Node 17+ without the legacy OpenSSL provider. Use one of the
commands from [Node 17 or newer](#node-17-or-newer).

**The first compile takes minutes**
`vue.config.js` turns on file polling for the dev server (`watchOptions.poll`),
and the round data files are large. The first build can take a couple of
minutes; rebuilds after edits take seconds.

**Port 8080 is already in use**
Pass another port: `... serve --port 8081`.

**Commit fails with `.husky/_/husky.sh: No such file or directory`**
The hook helper was never installed, usually because dependencies were
installed with `--ignore-scripts`, or because you are in a git worktree whose
`core.hooksPath` points at another checkout. Run `npx husky install` from the
checkout you are committing in. In a worktree, also point the hooks at it:

```bash
git config --worktree core.hooksPath .husky
```

**"Something about this Browser is not allowing for Local Storage"**
The reading list is kept in `localStorage`; private windows or blocked site
data turn it off. The site still works, but read marks will not be saved.
