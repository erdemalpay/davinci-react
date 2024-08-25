import { Dispatch, SetStateAction } from "react";
export interface Tab {
  number: number;
  content: React.ReactNode;
  icon?: React.ReactNode | null;
  label: string;
  isDisabled: boolean;
}

export interface BreadCrumbItem {
  title: string;
  path: string;
}

export interface ActionType<T> {
  name: string;
  isModal: boolean;
  className?: string;
  icon: React.ReactNode;
  isDisabled?: boolean;
  node?: (row: T) => React.ReactNode;
  modal?: React.ReactNode;
  onClick?: (row: T) => void;
  isModalOpen?: boolean;
  setIsModal?: (value: boolean) => void;
  setRow?: (value: T) => void;
  isPath: boolean;
  path?: string;
}

export interface FilterType<T> {
  node: React.ReactNode;
  label?: string;
  isUpperSide: boolean;
  isDisabled?: boolean;
}

export interface RowKeyType<T> {
  key: string;
  node?: (row: T) => React.ReactNode;
  isOptional?: boolean;
  isImage?: boolean;
  className?: string;
  options?: {
    label: string;
    bgColor: string; // must be css color
    textColor: string; // must be css color
  }[];
}
export interface ColumnType<T> {
  key: string;
  isSortable: boolean;
  isAddable?: boolean;
  className?: string;
  correspondingKey?: string;
  node?: () => React.ReactNode;
  onClick?: () => void;
}
type FormElementsState = {
  [key: string]: any; // Adjust the type as needed for your form elements
};

export interface PanelFilterType<T> {
  isFilterPanelActive: boolean;
  inputs: GenericInputType[];
  formElements: FormElementsState; // Add this to hold the current form state
  setFormElements: Dispatch<SetStateAction<FormElementsState>>; // Add this to update the form state
  closeFilters: () => void;
}
export interface GenericInputType {
  type: InputTypes;
  required: boolean;
  additionalType?: string;
  formKey: string;
  options?: any[];
  label?: string;
  placeholder?: string;
  folderName?: string;
  inputClassName?: string;
  isMultiple?: boolean;
  isDatePicker?: boolean;
  isDateInitiallyOpen?: boolean;
  isTopFlexRow?: boolean;
  isDisabled?: boolean;
  minNumber?: number;
  isNumberButtonsActive?: boolean;
  isOnClearActive?: boolean;
  isAutoFill?: boolean;
  invalidateKeys?: {
    key: string;
    defaultValue: string | boolean | number | undefined;
  }[];
}

export interface FormKeyType {
  key: string;
  type: string;
}

export enum InputTypes {
  TEXT = "text",
  DATE = "date",
  NUMBER = "number",
  SELECT = "select",
  TEXTAREA = "textarea",
  IMAGE = "image",
  PASSWORD = "password",
  TIME = "time",
  COLOR = "color",
  CHECKBOX = "checkbox",
}
export enum FormKeyTypeEnum {
  STRING = "string",
  NUMBER = "number",
  COLOR = "color",
  DATE = "date",
  BOOLEAN = "boolean",
  CHECKBOX = "checkbox",
}

export interface NavigationType {
  name: string;
  path: string;
  additionalSubmitFunction?: () => void;
  canBeClicked: boolean;
}
