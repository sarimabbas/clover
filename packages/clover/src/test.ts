import { makeRequestHandler } from "./server";
import { makeFetcher } from "./client";
import { z } from "zod";
import { makeOpenAPISchema } from "./utils";

const { clientTypes, openAPISchema } = makeRequestHandler({
  input: z.object({
    id: z.string(),
    name: z.string(),
  }),
  output: z.object({
    id: z.string(),
  }),
  method: "GET",
  path: "/test/:id",
  run: async ({ request, input, sendOutput }) => {
    const { id } = input;
    return sendOutput({ id });
  },
});

const getTest = makeFetcher({
  baseUrl: "http://localhost:3000",
});

const resp = getTest<typeof clientTypes>({
  input: {
    name: "test",
  },
  method: "GET",
  path: "/test/:id",
  validator: z.object({
    id: z.string(),
  }),
});

const finalSchema = makeOpenAPISchema([openAPISchema]);
