import { OEmbedProvider } from "@/types";
import { JSDOM } from "jsdom";
import { NextApiRequest, NextApiResponse } from "next";
import cors from "nextjs-cors";
import normalizeUrl from "normalize-url";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res);

  const { url, maxheight, maxwidth } = await req.body;

  // get endpoint
  let endpoint: string | undefined = undefined;
  endpoint = await getEndpointFromProviderList(url);
  if (!endpoint) {
    endpoint = await getEndpointFromDiscovery(url);
  }

  // if no endpoint, return 404
  if (!endpoint) {
    return res.status(404).json({
      error: "No endpoint found",
    });
  }

  const fetchThisURL = new URL(endpoint);
  fetchThisURL.searchParams.set("format", "json");
  fetchThisURL.searchParams.set("url", url);
  if (maxwidth) {
    fetchThisURL.searchParams.set("maxwidth", maxwidth);
  }
  if (maxheight) {
    fetchThisURL.searchParams.set("maxheight", maxheight);
  }

  // fetch the oembed data
  const response = await fetch(fetchThisURL);
  const json = await response.json();

  // return the oembed data
  return res.status(200).json(json);
};

export default handler;

const getEndpointFromProviderList = async (
  url: string
): Promise<string | undefined> => {
  // find the oembed provider
  const providers = await fetch("https://oembed.com/providers.json");
  const providersJson: OEmbedProvider[] = await providers.json();

  // find the provider that matches the url
  const normalizedUrl = new URL(
    normalizeUrl(url, {
      stripWWW: true,
    })
  ).hostname;

  const provider = providersJson.find((provider) => {
    const normalizedProviderUrl = new URL(
      normalizeUrl(provider.provider_url, {
        stripWWW: true,
      })
    ).hostname;
    return normalizedProviderUrl === normalizedUrl;
  });

  // find the endpoint that matches the url
  return provider?.endpoints?.[0]?.url;
};

const getEndpointFromDiscovery = async (
  url: string
): Promise<string | undefined> => {
  const response = await fetch(url);
  const endpointFromDOM = await getEndpointFromDOM(response);
  const endpointFromHeaders = await getEndpointFromHeaders(response);
  return endpointFromDOM ?? endpointFromHeaders;
};

export const getEndpointFromDOM = async (
  response: Response
): Promise<string | undefined> => {
  const html = await response.text();

  const dom = new JSDOM(html);
  const link = dom.window.document.querySelector(
    "link[rel='alternate'][type='application/json+oembed']"
  );
  if (link) {
    return link.getAttribute("href") ?? undefined;
  }
};

export const getEndpointFromHeaders = async (
  response: Response
): Promise<string | undefined> => {
  const header = response.headers.get("link");
  if (header) {
    const links = header.split(",");
    const link = links.find((link) => {
      const parts = link.split(";");
      const type = parts[1].trim();
      return type === "type=application/json+oembed";
    });
    if (link) {
      return link.split(";")[0].trim();
    }
  }
};
