# Changelog

## [0.1.1](https://github.com/kimzuni-labs/yamllint-js/compare/v0.1.0...v0.1.1) (2026-02-13)


### ✨ Features

* add internal exports and update types/jsdoc ([89349f4](https://github.com/kimzuni-labs/yamllint-js/commit/89349f4fd6bc25240554ea39f66f4639fcd5b934))


### 🐛 Bug Fixes

* include broken symlinks in file list ([89349f4](https://github.com/kimzuni-labs/yamllint-js/commit/89349f4fd6bc25240554ea39f66f4639fcd5b934))
* isBlockEnd getter on Token class ([#28](https://github.com/kimzuni-labs/yamllint-js/issues/28)) ([d712164](https://github.com/kimzuni-labs/yamllint-js/commit/d7121642be7a991ebc2e1805305bf2bf28fe0404))

## 0.1.0 (2025-12-21)


### 🚚 Porting

* **cli:** finish cli module ([16b5dbf](https://github.com/kimzuni-labs/yamllint-js/commit/16b5dbf3b858bd08f8f4dedc51936db40917510c))
* **config:** partially config module ([9d89607](https://github.com/kimzuni-labs/yamllint-js/commit/9d896074e596577d7f2de868827832c407af8054))
* **decoder:** finish decoder module ([7d5a4ae](https://github.com/kimzuni-labs/yamllint-js/commit/7d5a4aed1f5a32fbcaa6a23e7ff5c0feb4f478fc))
* **linter:** finish linter module ([8d80bdc](https://github.com/kimzuni-labs/yamllint-js/commit/8d80bdc9643bf33d2271ab88206f947a97cd16b8))
* **linter:** partially linter module ([787e31d](https://github.com/kimzuni-labs/yamllint-js/commit/787e31defbcd3407ff73570ed1b1c4dfd441c11c))
* **parser:** finish parser module ([fac0874](https://github.com/kimzuni-labs/yamllint-js/commit/fac08744256de9c3e908ca4d64342a112498d0c9))
* **rules:** finish anchors rule ([1a59996](https://github.com/kimzuni-labs/yamllint-js/commit/1a59996fc53a61934a90a07aba1d32454db9f3ad))
* **rules:** finish braces rule ([04f6d7a](https://github.com/kimzuni-labs/yamllint-js/commit/04f6d7aafafd34bb50845d4e918c8ef845e2e6a7))
* **rules:** finish brackets rule ([f3b540e](https://github.com/kimzuni-labs/yamllint-js/commit/f3b540e300d417a7637287458b405483376852b7))
* **rules:** finish colons rule ([4f841c1](https://github.com/kimzuni-labs/yamllint-js/commit/4f841c1f00f8ea35bbe5e6efe55a106ac9130413))
* **rules:** finish commas rule ([50408d5](https://github.com/kimzuni-labs/yamllint-js/commit/50408d56f2a23787720b0014a3cb29b0975895f5))
* **rules:** finish comments rule ([0fcdfa0](https://github.com/kimzuni-labs/yamllint-js/commit/0fcdfa0ef0a4abda698966156173e17885ac785d))
* **rules:** finish comments-indentation rule ([25b087f](https://github.com/kimzuni-labs/yamllint-js/commit/25b087fe6b084aed79c90ed1c695c84aa186792d))
* **rules:** finish document-end rule ([b131066](https://github.com/kimzuni-labs/yamllint-js/commit/b131066c03426e0941ffc4777717ff2d7309c365))
* **rules:** finish document-start rule ([8bba829](https://github.com/kimzuni-labs/yamllint-js/commit/8bba829ce513030878bd14daa2056316949f696b))
* **rules:** finish empty-lines rule ([31d47ca](https://github.com/kimzuni-labs/yamllint-js/commit/31d47caaef1d09f703ae5f2ae96f9757f57bb2f7))
* **rules:** finish empty-values rule ([8651b67](https://github.com/kimzuni-labs/yamllint-js/commit/8651b67e8c948d736031ef443f118c05dbcb55fb))
* **rules:** finish float-values rule ([3c97283](https://github.com/kimzuni-labs/yamllint-js/commit/3c9728316ded669d19aac79f2d0cf056a71a587d))
* **rules:** finish hyphens rule ([ead3684](https://github.com/kimzuni-labs/yamllint-js/commit/ead3684d547085834e166aa70759559eef02e210))
* **rules:** finish indentation rule ([9668ae8](https://github.com/kimzuni-labs/yamllint-js/commit/9668ae8ce6448f544c3968eb4ee7f438156ee6e5))
* **rules:** finish key-duplicates rule ([bc3b7e6](https://github.com/kimzuni-labs/yamllint-js/commit/bc3b7e6fe7a279629bde1f9a7ea631a58cac812e))
* **rules:** finish key-ordering rule ([5fc2b1f](https://github.com/kimzuni-labs/yamllint-js/commit/5fc2b1f91883b7498f2e1389f05cf494b30b8bce))
* **rules:** finish line-length rule ([e8402de](https://github.com/kimzuni-labs/yamllint-js/commit/e8402de3307a2637ad8bb7e2790b5ad6055bf209))
* **rules:** finish new-line-at-end-of-file rule ([4001c68](https://github.com/kimzuni-labs/yamllint-js/commit/4001c682fa7bdf3e31c9b87e5ef69f59ec01e2c4))
* **rules:** finish new-lines rule ([58deafc](https://github.com/kimzuni-labs/yamllint-js/commit/58deafce19674ce9b9ae05280a01d17357048ae6))
* **rules:** finish octal-values rule ([b2157ad](https://github.com/kimzuni-labs/yamllint-js/commit/b2157ad862faa93f96b38f8a69004784e0ba12bd))
* **rules:** finish quoted-strings rule ([abb3297](https://github.com/kimzuni-labs/yamllint-js/commit/abb329770d363df1c9222c64dfaa275d524e2641))
* **rules:** finish trailing-spaces rule ([be734c0](https://github.com/kimzuni-labs/yamllint-js/commit/be734c0700924bbdf32478e7418532e7d2beda64))
* **rules:** finish truthy rule ([65ffc95](https://github.com/kimzuni-labs/yamllint-js/commit/65ffc9538375b963a7ba64b39dbc99f7eff3d229))
* **test:** finish config tests ([1067f0c](https://github.com/kimzuni-labs/yamllint-js/commit/1067f0c54be7721a92e0d1dff7ffe7ab9231f2ee))
* **tests:** finish module tests ([5811f9a](https://github.com/kimzuni-labs/yamllint-js/commit/5811f9af288c0ff0906dbf945c89dcdc7d383c62))
* **tests:** finish spec_examples tests ([803df51](https://github.com/kimzuni-labs/yamllint-js/commit/803df514a33bfc437400d025157eb416be5b8834))
* **tests:** finish syntax_errors tests ([00b6af5](https://github.com/kimzuni-labs/yamllint-js/commit/00b6af5f78dc8d1b63fa443a61c205354ba6076b))
* **tests:** finish yamllint_directives tests ([9adf767](https://github.com/kimzuni-labs/yamllint-js/commit/9adf767945b3e852220692ec12f09db622c1fefb))


### ✨ Features

* support yamllint.config files ([#3](https://github.com/kimzuni-labs/yamllint-js/issues/3)) ([b78d18f](https://github.com/kimzuni-labs/yamllint-js/commit/b78d18fbddcdea9efa32f0696617c73f01940a02))


### 🐛 Bug Fixes

* **new-lines:** stop after first detected problem ([6630c5b](https://github.com/kimzuni-labs/yamllint-js/commit/6630c5beaf381c752ad42c7e9577f1948e40c709))
* redos vulnerability mitigation ([#7](https://github.com/kimzuni-labs/yamllint-js/issues/7)) ([3a9bf25](https://github.com/kimzuni-labs/yamllint-js/commit/3a9bf25a764474c04ff98de0cfb23cbc21a4e1c3))
* rule config shorthand and add TypeScript autocomplete support ([#9](https://github.com/kimzuni-labs/yamllint-js/issues/9)) ([870d674](https://github.com/kimzuni-labs/yamllint-js/commit/870d67464a9837b4451072dc6d7eb3f0118c848d))


### 🔧 Other Changes

* ignore test type and release 0.1.0 ([b35ed12](https://github.com/kimzuni-labs/yamllint-js/commit/b35ed126a6de344f434a783a3f039be9f9457f28))


### ♻️ Code Refactoring

* show detectEncoding warning only once ([#6](https://github.com/kimzuni-labs/yamllint-js/issues/6)) ([cf8c0de](https://github.com/kimzuni-labs/yamllint-js/commit/cf8c0deaf045c5e656e54930b15dbf39a64bf20c))
