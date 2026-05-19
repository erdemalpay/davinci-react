import { MailType } from "../../utils/api/mail";

export type MailTemplateParameterType =
  | "string"
  | "email"
  | "url"
  | "date"
  | "currency"
  | "multiline";

export interface MailTemplateParameterDefinition {
  key: string;
  label: string;
  type: MailTemplateParameterType;
  required: boolean;
  description: string;
  example?: string;
}

export type MailTemplateValues = Record<string, string>;

export type MailTemplateProps = {
  values: MailTemplateValues;
};

export type MailTemplateOption = {
  value: MailType;
  label: string;
};
