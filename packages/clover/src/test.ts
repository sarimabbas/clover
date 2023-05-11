import { z } from "zod";
import { makeFetcher } from "./client";
import { makeRequestHandler } from "./server";

const { handler, clientConfig, openAPIPathsObject } = makeRequestHandler({
  input: z.object({
    name: z.string(),
  }),
  output: z.object({
    greeting: z.string(),
  }),
  run: async ({ request, input, sendOutput }) => {
    const { name } = input;
    return sendOutput({ greeting: `Hello, ${name}!` });
  },
  path: "/api/hello",
  method: "GET",
  description: "Greets the user",
  authenticate: async (req) => {
    return true;
  },
});

const getTest = makeFetcher({
  baseUrl: "http://localhost:3000",
});

const resp = getTest<typeof clientConfig>({
  input: {
    name: "test",
  },
  method: "GET",
  path: "/api/hello",
  validator: z.object({
    greeting: z.string(),
  }),
});
