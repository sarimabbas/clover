import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>Clover ☘️</span>,
  useNextSeoProps() {
    return {
      titleTemplate: "%s – Clover",
    };
  },
  head: (
    <>
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Clover" />
      <meta
        property="og:description"
        content="Server routes augmented with Zod and OpenAPI"
      />
      <meta
        property="og:image"
        content="https://clover.sarim.garden/cover.png"
      />
    </>
  ),
  footer: {
    text: <p>MIT {new Date().getFullYear()} © Clover.</p>,
  },
  project: {
    link: "https://github.com/sarimabbas/clover",
  },
  docsRepositoryBase:
    "https://github.com/sarimabbas/clover/tree/main/packages/docs",
};

export default config;
