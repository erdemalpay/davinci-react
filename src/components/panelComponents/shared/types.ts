import { Dispatch, SetStateAction } from "react";
export interface Tab {
  number: number;
  content: React.ReactNode;
  icon?: React.ReactNode | null;
  label: string;
  isDisabled: boolean;
  onOpenAction?: () => void;
  onCloseAction?: () => void;
  adjustedNumber?: number;
}

export interface BreadCrumbItem {
  title: string;
  path: string;
}

export interface ActionType<T> {
  name: string;
  isModal?: boolean;
  className?: string;
  icon?: React.ReactNode;
  isButton?: boolean;
  buttonClassName?: string;
  isDisabled?: boolean;
  node?: (row: T) => React.ReactNode;
  modal?: React.ReactNode;
  onClick?: (row: T) => void;
  isModalOpen?: boolean;
  setIsModal?: (value: boolean) => void;
  setRow?: (value: T) => void;
  isPath?: boolean;
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
export interface ColumnType {
  key: string;
  isSortable: boolean;
  isAddable?: boolean;
  className?: string;
  isActive?: boolean;
  correspondingKey?: string;
  node?: () => React.ReactNode;
  onClick?: () => void;
}
type FormElementsState = {
  [key: string]: any; // Adjust the type as needed for your form elements
};

export interface PanelFilterType {
  isFilterPanelActive: boolean;
  inputs: GenericInputType[];
  formElements: FormElementsState; // Add this to hold the current form state
  setFormElements: Dispatch<SetStateAction<FormElementsState>>; // Add this to update the form state
  closeFilters: () => void;
  isApplyButtonActive?: boolean;
  isFilterPanelCoverTable?: boolean;
  additionalFilterCleanFunction?: () => void;
  isCloseButtonActive?: boolean;
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
  isMinNumber?: boolean;
  isDebounce?: boolean;
  isDatePickerLabel?: boolean;
  triggerTabOpenOnChangeFor?: string;
  isSortDisabled?: boolean;
  handleTriggerTabOptions?: (value: any) => {
    value: any;
    label: string;
    imageUrl?: string;
  }[];
  additionalOnChange?: (value: any) => void;
  onChangeTrigger?: (value: any) => void;
  isReadOnly?: boolean;
  invalidateKeys?: {
    key: string;
    defaultValue:
      | string
      | boolean
      | number
      | undefined
      | Array<string>
      | Array<number>;
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
  CUSTOMINPUT = "customInput",
  HOUR = "hour",
  MONTHYEAR = "monthYear",
  TAB = "tab",
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
