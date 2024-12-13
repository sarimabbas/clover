# Clover

Server routes augmented with Zod and OpenAPI

![](./assets/cover.png)

+[![Test](https://github.com/protocols-fyi/clover/actions/workflows/test.yml/badge.svg)](https://github.com/protocols-fyi/clover/actions/workflows/test.yml)

## Installation

```bash
pnpm add @protocols-fyi/clover
```

Or use `npm` or `yarn`.

## Docs

You can find the latest documentation on <https://clover.sarim.garden>

## Releasing

First update the changeset with your changes

```bash
pnpm changeset
```

If the GitHub Actions is configured, push and then accept that bots PR.

Otherwise it can be manually released with

```bash
pnpm release
```
