import { generateSchema } from "@anatine/zod-openapi";
import merge from "lodash.merge";
import { oas31 } from "openapi3-ts";
import { z } from "zod";
import { commonReponses } from "./responses";
import {
  HTTPMethod,
  getKeysFromPathPattern,
  getParamsFromPath,
  httpMethodSupportsRequestBody,
} from "./utils";

export interface IMakeRequestHandlerProps<
  TInput extends z.AnyZodObject,
  TOutput extends z.AnyZodObject,
  TMethod extends HTTPMethod,
  TPath extends string
> {
  /**
   * describe the shape of the input
   */
  input: TInput;
  /**
   * describe the shape of the output
   */
  output: TOutput;
  /**
   * specify the HTTP method
   */
  method: TMethod;
  /**
   * specify the path
   */
  path: TPath;
  /**
   * optional description
   */
  description?: string;
  /**
   * optional tags
   */
  tags?: string[];
  /**
   * the presence of this property will make the route require bearer authentication
   * @param request - the request, do whatever you want with it
   * @returns - if false, the request will be rejected
   */
  authenticate?: (request: Request) => Promise<boolean>;
  /**
   * a callback inside which you can run your logic
   * @returns a response to send back to the client
   */
  run: ({
    request,
    input,
    sendOutput,
  }: {
    /**
     * the raw request, do whatever you want with it
     */
    request: Request;
    /**
     * a helper with the input data
     */
    input: z.infer<TInput>;
    /**
     * @param output - the output data
     * @returns a helper to send the output
     */
    sendOutput: (
      output: z.infer<TOutput>,
      options?: Partial<ResponseInit>
    ) => Promise<Response>;
  }) => Promise<Response>;
}

export interface IClientConfig<
  TInput extends z.AnyZodObject,
  TOutput extends z.AnyZodObject,
  TMethod extends HTTPMethod,
  TPath extends string
> {
  /**
   * the typescript types for the input
   * exclude the path parameters that are automatically added
   */
  // input: HumanReadable<Omit<z.infer<TInput>, PathParamNames<TPath>>>;
  input: z.infer<TInput>;
  /**
   * the zod schema for the output
   */
  output: TOutput;
  /**
   * the HTTP method
   */
  method: TMethod;
  /**
   * the path the route is available on
   */
  path: TPath;
}

export interface IMakeRequestHandlerReturn<
  TInput extends z.AnyZodObject,
  TOutput extends z.AnyZodObject,
  TMethod extends HTTPMethod,
  TPath extends string
> {
  /**
   * config object used to generate typescript types
   */
  clientConfig: IClientConfig<TInput, TOutput, TMethod, TPath>;
  /**
   * OpenAPI schema for this route
   */
  openAPIPathsObject: oas31.PathsObject;
  /**
   * @returns WinterCG compatible handler that you can use in your routes
   */
  handler: (request: Request) => Promise<Response>;
}

export const makeRequestHandler = <
  TInput extends z.AnyZodObject,
  TOutput extends z.AnyZodObject,
  TMethod extends HTTPMethod,
  TPath extends string
>(
  props: IMakeRequestHandlerProps<TInput, TOutput, TMethod, TPath>
): IMakeRequestHandlerReturn<TInput, TOutput, TMethod, TPath> => {
  const openAPIParameters: (oas31.ParameterObject | oas31.ReferenceObject)[] = [
    // query parameters
    ...(!httpMethodSupportsRequestBody[props.method]
      ? Object.keys(props.input.shape)
          // exclude query parameters that are already path parameters
          .filter((key) => {
            return !getKeysFromPathPattern(props.path).some(
              (k) => String(k.name) === key
            );
          })
          .map((key) => {
            return {
              name: key,
              in: "query" as oas31.ParameterLocation,
              schema: {
                type: "string" as oas31.SchemaObjectType,
              },
            };
          })
      : []),
    // add path parameters
    ...getKeysFromPathPattern(props.path).map((key) => ({
      name: String(key.name),
      in: "path" as oas31.ParameterLocation,
      required: true,
      schema: {
        type: "string" as oas31.SchemaObjectType,
      },
    })),
  ];

  const openAPIRequestBody:
    | oas31.ReferenceObject
    | oas31.RequestBodyObject
    | undefined = httpMethodSupportsRequestBody[props.method]
    ? {
        content: {
          "application/json": {
            schema: generateSchema(props.input),
          },
        },
      }
    : undefined;

  const openAPIOperation: oas31.OperationObject = {
    description: props.description,
    security: props.authenticate ? [{ bearerAuth: [] }] : undefined,
    parameters: openAPIParameters,
    requestBody: openAPIRequestBody,
    responses: {
      // success
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: generateSchema(props.output),
          },
        },
      },
      // bad request
      400: commonReponses[400].openAPISchema,
      // unauthorized
      401: props.authenticate ? commonReponses[401].openAPISchema : undefined,
      // sarim: i don't think we need this
      // 405: commonReponses[405].openAPISchema,
    },
    tags: props.tags,
  };

  const openAPIPathItem: oas31.PathItemObject = {
    [props.method.toLowerCase()]: openAPIOperation,
  };

  const openAPIPath: oas31.PathsObject = {
    [props.path]: openAPIPathItem,
  };

  const handler = async (request: Request) => {
    const requestForRun = request.clone();
    const requestForAuth = request.clone();

    // ensure the method is correct
    if (request.method !== props.method) {
      return commonReponses[405].response();
    }

    // ensure authentication is correct
    if (props.authenticate && !(await props.authenticate(requestForAuth))) {
      return commonReponses[401].response();
    }

    // parse the input
    const unsafeData = {
      // parse input from path parameters
      ...getParamsFromPath(props.path, new URL(request.url).pathname),
      // parse input from query parameters or body
      ...(httpMethodSupportsRequestBody[request.method as HTTPMethod]
        ? // if the method supports a body, parse it
          await request.json()
        : // otherwise, parse the query parameters
          Object.fromEntries(new URL(request.url).searchParams.entries())),
    };

    // parse the input with zod schema
    const parsedData = await props.input.safeParseAsync(unsafeData);

    // if the input is invalid, return a 400
    if (!parsedData.success) {
      return commonReponses[400].response(parsedData.error);
    }

    const input = parsedData.data;

    // utility function to send output response
    const sendOutput = async (
      output: z.infer<TOutput>,
      options?: Partial<ResponseInit>
    ) => {
      return new Response(
        JSON.stringify(output),
        merge(
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
          options
        )
      );
    };

    // run the user's code
    try {
      return await props.run({ request: requestForRun, input, sendOutput });
    } catch (error) {
      return commonReponses[500].response(error);
    }
  };

  return {
    clientConfig: {
      input: {} as any, // implementation does not matter, we just need the types
      output: props.output, // echo the zod schema
      method: props.method,
      path: props.path,
    },
    openAPIPathsObject: openAPIPath,
    handler,
  };
};
