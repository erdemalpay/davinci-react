import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  footer?: React.ReactNode;
  header: React.ReactNode;
}>;

export default function MailTemplateShell({ children, footer, header }: Props) {
  return (
    <div className="bg-[#f5f7fb] p-4 sm:p-8 font-sans">
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
        {header}
        <div className="p-6 text-left sm:p-8">{children}</div>
        {footer && (
          <div className="border-t border-[#e6eaf0] bg-[#f9fafb] p-6 text-center text-[13px] leading-5 text-gray-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
