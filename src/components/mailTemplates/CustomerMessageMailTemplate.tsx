import MailTemplateShell from "./MailTemplateShell";
import { MailTemplateProps } from "./types";

export default function CustomerMessageMailTemplate({
  values,
}: MailTemplateProps) {
  return (
    <MailTemplateShell
      header={
        <div className="bg-gray-800 p-8 text-left">
          <h1 className="m-0 text-2xl font-semibold leading-snug text-white">
            {values.headline || "Headline"}
          </h1>
        </div>
      }
    >
      {values.imageUrl && (
        <div className="mb-6 text-center">
          <img
            src={values.imageUrl}
            alt={values.imageAlt || values.headline}
            className="block h-auto w-full max-w-[540px] rounded-lg border border-gray-200"
          />
        </div>
      )}
      <div className="whitespace-pre-line text-base leading-7 text-gray-700">
        {values.message || "Message"}
      </div>
      {values.ctaUrl && (
        <div className="my-8 text-center">
          <a
            href={values.ctaUrl}
            className="inline-block rounded-md bg-blue-600 px-7 py-3.5 text-base font-bold text-white no-underline"
          >
            {values.ctaText || "Detaylari Gor"}
          </a>
        </div>
      )}
      {values.note && (
        <div className="mt-7 whitespace-pre-line rounded border-l-4 border-gray-400 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          {values.note}
        </div>
      )}
    </MailTemplateShell>
  );
}
