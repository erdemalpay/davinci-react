export interface Tab {
  number: number;
  content: React.ReactNode;
  icon: React.ReactNode | null;
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
  modal?: React.ReactNode;
  onClick?: (row: T) => void;
  isModalOpen?: boolean;
  setIsModal?: (value: boolean) => void;
  setRow?: (value: T) => void;
  isPath: boolean;
  path?: string;
}

export interface RowKeyType {
  key: string;
  node?: React.ReactNode;
  isOptional?: boolean;
  isImage?: boolean;
  className?: string;
  options?: {
    label: string;
    bgColor: string; // must be css color
    textColor: string; // must be css color
  }[];
}
