import { axiosClient } from "./axiosClient";

interface BaseRequest {
  path: string;
}

interface RequestWithPayload<P> extends BaseRequest {
  payload: P;
}

export interface UpdatePayload<P> {
  id: number | string;
  updates: Partial<P>;
}

function printStackTrace() {
  const error = new Error();
  const stack = error.stack
    ?.split("\n")
    .slice(2)
    .map((line: string) => line.replace(/\s+at\s+/, ""))
    .join("\n");
  console.log(stack);
}

// P = payload, R = ResponseType
export async function get<R>({ path }: BaseRequest): Promise<R> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const { data } = await axiosClient.get<R>(`${path}`, {
    headers,
  });

  return data;
}

// P = payload, R = ResponseType
export async function post<P, R>({
  path,
  payload,
}: RequestWithPayload<P>): Promise<R> {
  const { data } = await axiosClient.post<R>(`${path}`, payload);
  return data;
}

// P = payload, R = ResponseType
export async function put<P, R>({
  path,
  payload,
}: RequestWithPayload<P>): Promise<R> {
  return axiosClient.put(`${path}`, payload);
}

// P = payload, R = ResponseType
export async function patch<P, R>({
  path,
  payload,
}: RequestWithPayload<P>): Promise<R> {
  return axiosClient.patch(`${path}`, payload);
}

// R = ResponseType
export async function remove<R>({ path }: BaseRequest): Promise<R> {
  return axiosClient.delete(`${path}`);
}
