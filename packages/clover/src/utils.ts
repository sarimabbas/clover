import { oas31 } from "openapi3-ts";
import { Key, Path, match, pathToRegexp } from "path-to-regexp";

export type OpenAPIObject = oas31.OpenAPIObject;
export type OpenAPIPathsObject = oas31.PathsObject;
export type OpenAPIPathItemObject = oas31.PathItemObject;

export type HumanReadable<T> = {
  [K in keyof T]: T[K];
} & {};

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const httpMethodSupportsRequestBody: Record<HTTPMethod, boolean> = {
  GET: false,
  POST: true,
  PUT: true,
  PATCH: true,
  DELETE: false,
};

export const getKeysFromPathPattern = (pattern: Path): Key[] => {
  const keys: Key[] = [];
  pathToRegexp(pattern, keys);
  return keys;
};

export const getParamsFromPath = (
  pattern: string,
  input: string
): Record<string, any> => {
  const matcher = match(pattern, { decode: decodeURIComponent });
  const result = matcher(input);
  if (!result) {
    return {};
  }
  return result.params;
};

/**
 * get all parameters from an API path
 * thanks to Zodios for this snippet
 * @param Path - API path
 * @details - this is using tail recursion type optimization from typescript 4.5
 */
export type PathParamNames<
  Path,
  Acc = never
> = Path extends `${string}:${infer Name}/${infer R}`
  ? PathParamNames<R, Name | Acc>
  : Path extends `${string}:${infer Name}`
  ? Name | Acc
  : Acc;
