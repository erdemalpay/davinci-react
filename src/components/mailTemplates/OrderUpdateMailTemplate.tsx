import MailTemplateShell from "./MailTemplateShell";
import { MailTemplateProps } from "./types";

export default function OrderUpdateMailTemplate({ values }: MailTemplateProps) {
  return (
    <MailTemplateShell
      header={
        <div className="bg-teal-700 p-8 text-left">
          {values.orderNumber && (
            <p className="mb-2 text-sm text-teal-100">
              Siparis #{values.orderNumber}
            </p>
          )}
          <h1 className="m-0 text-2xl font-semibold leading-snug text-white">
            {values.statusTitle || "Status title"}
          </h1>
        </div>
      }
    >
      <div className="whitespace-pre-line text-base leading-7 text-gray-700">
        {values.statusMessage || "Status message"}
      </div>
      {values.estimatedDeliveryDate && (
        <div className="mt-6 rounded-md bg-emerald-50 p-4 text-[15px] text-emerald-800">
          Tahmini teslim tarihi:{" "}
          <strong>{values.estimatedDeliveryDate}</strong>
        </div>
      )}
      {values.trackingUrl && (
        <div className="mb-1 mt-8 text-center">
          <a
            href={values.trackingUrl}
            className="inline-block rounded-md bg-teal-700 px-7 py-3.5 text-base font-bold text-white no-underline"
          >
            Siparisi Takip Et
          </a>
        </div>
      )}
    </MailTemplateShell>
  );
}
