export interface Tab {
  number: number;
  content: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}

export interface BreadCrumbItem {
  title: string;
  path: string;
}
