export interface Tab {
  number: number;
  content: React.ReactNode;
  icon: React.ReactNode;
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
  icon: React.ReactNode;
  modal?: React.ReactNode;
  isModalOpen?: boolean;
  setIsModal?: (value: boolean) => void;
  setRow?: (value: T) => void;
  isPath: boolean;
  path?: string;
  bgColor?: string;
}

export interface RowKeyType {
  key: string;
  isOptional?: boolean;
  isImage?: boolean;
  width?: string;
  paddingX?: string; //default 0.5rem
  paddingY?: string; //default 0.2rem
  options?: {
    label: string;
    bgColor: string; // must be css color
    textColor: string; // must be css color
  }[];
}
