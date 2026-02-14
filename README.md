# yamllint-js

This project is an unofficial Node.js port of
[adrienverge/yamllint](https://github.com/adrienverge/yamllint),
yamllint created by
[Adrien Vergé](https://github.com/adrienverge).

The original project is licensed under GPL-3.0, which also applies here.

---

A linter for YAML files — an unofficial native Node.js port of Python yamllint.

yamllint-js does not only check for syntax validity, but for weirdnesses like key
repetition and cosmetic problems such as lines length, trailing spaces,
indentation, etc.

[![CI](https://github.com/kimzuni-labs/yamllint-js/actions/workflows/ci.yml/badge.svg)](https://github.com/kimzuni-labs/yamllint-js/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/yamllint-js.svg)](https://www.npmjs.com/package/yamllint-js)
[![codecov](https://codecov.io/gh/kimzuni-labs/yamllint-js/graph/badge.svg?token=LU39PGBWUF)](https://codecov.io/gh/kimzuni-labs/yamllint-js)



## Why

The goal of this project is to enable the use of yamllint in Node.js-only
environments without requiring Python, by providing a Node.js–native port
that aims for 100% compatibility with the original Python implementation.

In addition, several improvements were made during the porting process
to enhance the tool itself, not just its integration with Node.js:

1. Fix a new-lines issue (<https://github.com/adrienverge/yamllint/issues/475>)
2. Support for JavaScript/TypeScript [configuration files](#configuration)
3. Mitigated a ReDoS vulnerability



## Documentation

> [!NOTE]
> This package does not include standalone documentation.
> Instead, please consult the official yamllint (Python) documentation.

<https://yamllint.readthedocs.io/>



## Overview

### Screenshot

![yamllint-js screenshot](./images/npx-yamllint-js.png)

![yamllint-js.config.mjs screenshot](./images/yamllint-js.config.mjs.png)



### Installation

```shell
# npm
npm install yamllint-js

# yarn
yarn add yamllint-js

# bun
bun add yamllint-js
```

or global installation:

```shell
npm install -g yamllint-js
yarn global install yamllint-js
bun add -g yamllint-js
```

yamllint is also packaged for all major operating systems,
see installation examples (`dnf`, `apt-get`...)
[in the official yamllint (Python) documentation](https://yamllint.readthedocs.io/en/stable/quickstart.html).



### Usage

> [!NOTE]
> `yarn` or `bun` can be used as alternatives to `npx`,
> and `npx` can be omitted if the package is installed globally.

All `node_modules` directories are ignored.

```shell
npx yamllint-js ...
# alias
npx yamllint ...
```

```shell
# Lint one or more files
npx yamllint-js my_file.yml my_other_file.yaml ...
```

```shell
# Recursively lint all YAML files in a directory
npx yamllint-js .
```

```shell
# Use a pre-defined lint configuration
npx yamllint-js -d relaxed file.yaml

# Use a custom lint configuration
npx yamllint-js -c /path/to/myconfig file-to-lint.yaml
```

```shell
# Output a parsable format (for syntax checking in editors like Vim, emacs...)
npx yamllint-js -f parsable file.yaml
```

[Read more in the complete official yamllint (Python) documentation!](https://yamllint.readthedocs.io/)



### Configuration

In addition to the yamllint configuration format,
JavaScript and TypeScript configuration files are also supported:

- [yamllint configuration files and environment variables](https://yamllint.readthedocs.io/en/stable/configuration.html):
- [Cosmiconfig default search places](https://github.com/cosmiconfig/cosmiconfig/blob/a5a842547c13392ebb89a485b9e56d9f37e3cbd3/src/defaults.ts#L12-L32):
  + `package.json` (`"yamllint-js"` field),  `yamllint-js.config.ts`, etc. (Not support `rc` files)
  + `package.json` (`"yamllint"` field),  `.yamllintrc.json`,  `yamllint.config.ts`, etc.

Configuration can be easily defined with type hints, like:

```typescript
/** @type {import("yamllint-js").UserConfig")} */

const config = {/* ... */};

modules.exports = config;
```

or, with an explicit type:

```typescript
import { defineConfig, type UserConfig } from "yamllint-js";

const config: UserConfig = {/* ... */};

export default defineConfig(config);
```

[Read more in the Configuration page of the official yamllint (Python) documentation!](https://yamllint.readthedocs.io/en/stable/configuration.html)



### Features

Here is a yamllint-js configuration file example:

```yaml
extends: default

rules:
  # 80 chars should be enough, but don't fail if a line is longer
  line-length:
    max: 80
    level: warning

  # don't bother me with this rule
  indentation: disable
```

Within a YAML file, special comments can be used to disable checks for a single line:

```yaml
This line is waaaaaaaaaay too long  # yamllint disable-line
# and support yamllint-js
This line is waaaaaaaaaay too long  # yamllint-js disable-line
```

or for a whole block:

```yaml
# yamllint disable rule:colons
- Lorem       : ipsum
  dolor       : sit amet,
  consectetur : adipiscing elit
# yamllint enable
```

Specific files can be ignored (totally or for some rules only) using a `.gitignore`-style pattern:

```yaml
# For all rules
ignore: |
  *.dont-lint-me.yaml
  /bin/
  !/bin/*.lint-me-anyway.yaml

rules:
  key-duplicates:
    ignore: |
      generated
      *.template.yaml
  trailing-spaces:
    ignore: |
      *.ignore-trailing-spaces.yaml
      /ascii-art/*
```

[Read more in the complete official yamllint (Python) documentation!](https://yamllint.readthedocs.io/)



## License

[GPL version 3](./LICENSE)
