import { useMutation } from "@tanstack/react-query";
import { post } from ".";

export type FilterSchemaField =
  | { type: "select"; label: string; options: { label: string; value: string }[] }
  | { type: "date"; label: string }
  | { type: "text"; label: string }
  | { type: "number"; label: string };

export interface TableColumn {
  label: string;
  searchKey: string;
}

export interface TableFilterQueryPayload {
  query: string;
  tableName: string;
  schema: Record<string, FilterSchemaField>;
  tableColumns?: TableColumn[];
}

export interface TableFilterQueryResponse {
  filters: Record<string, string>;
  searchQuery?: string;
  explanation: string;
}

export function useAITableFilter() {
  return useMutation({
    mutationFn: (payload: TableFilterQueryPayload) =>
      post<TableFilterQueryPayload, TableFilterQueryResponse>({
        path: "/ai/table-filter",
        payload,
      }),
  });
}
