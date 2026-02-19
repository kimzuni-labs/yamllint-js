# Contributing Guide

Thank you for considering contributing to this project! 💛

All contributions—issues, pull requests, or suggestions—are welcome.

Please follow this guide to help ensure smooth collaboration.



## 🧩 Development Environment

This project uses [Bun](https://bun.sh/) for a faster runtime during development and deployment.

However, **contributors do not need to use Bun** — Node.js is fully supported.



## 🚀 Setup

Clone the repository and install dependencies.

1. Clone the repository:

    ```shell
    git clone https://github.com/kimzuni-labs/yamllint-js.git
    cd yamllint-js
    ```

2. Install dependencies:

    ```shell
    npm install
    # or (faster)
    bun ci
    ```

## 🎨 Linting

You can run all lint checks with:

```shell
npm run lint
```

Or run them individually:

```shell
npm run lint:eslint
npm run lint:types
npm run lint:markdown
npm run lint:yaml
```

## 🧪 Testing

Make sure your changes work as expected.

```shell
npm run test
```



## 🧭 Pull Request Guide

Your pull request doesn't have to be perfect — just open it!
I'll help out if needed. ✨

1. **Keep your branch up to date**
    + Rebase or merge the latest `main` branch before opening a PR.
2. **Update related documentation and tests**
    + If you add or modify a feature, update any relevant documentation such as **README** files or **JSDoc comments**.
    + Also, write or update corresponding **test cases** to ensure your changes are covered.
    + Keeping documentation and tests up to date helps others understand and verify your changes.
3. **Run linting and tests**
    + Run linting and testing to verify your changes before submitting a PR.
    + See [Linting](#-linting) and [Testing](#-testing) for details.
4. **Keep PRs small and focused**
    + If your changes are minor, it's fine to include them all in a single pull request.  
    + If your changes are large or involve multiple features, please split them into separate PRs by feature or purpose.
    + Avoid bundling unrelated changes into one pull request, as large PRs are harder to review and delay merging.
5. **Write clear descriptions**
    + Explain what changes were made and why.
    + Mention related issues (e.g., `Fixes #123`).

---

Thank you for helping improve the project! 💛
