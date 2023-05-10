export interface OEmbedProvider {
  provider_name: string;
  provider_url: string;
  endpoints: {
    schemes: string[];
    url: string;
    formats: string[];
  }[];
}
