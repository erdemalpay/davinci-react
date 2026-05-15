import MailTemplateShell from "./MailTemplateShell";
import { MailTemplateProps } from "./types";

export default function CampaignAnnouncementMailTemplate({
  values,
}: MailTemplateProps) {
  return (
    <MailTemplateShell
      header={
        <div className="bg-orange-900 p-8 text-center">
          <h1 className="m-0 text-[26px] font-semibold leading-snug text-white">
            {values.campaignTitle || "Campaign title"}
          </h1>
          {values.expiresAt && (
            <p className="mt-3 text-sm text-orange-100">
              Son tarih: {values.expiresAt}
            </p>
          )}
        </div>
      }
    >
      <div className="whitespace-pre-line text-base leading-7 text-gray-700">
        {values.campaignMessage || "Campaign message"}
      </div>
      {values.discountCode && (
        <div className="my-7 rounded-md border border-dashed border-orange-500 bg-orange-50 p-5 text-center">
          <p className="mb-2 text-[13px] text-orange-800">Indirim kodu</p>
          <p className="text-[22px] font-bold tracking-wider text-orange-900">
            {values.discountCode}
          </p>
        </div>
      )}
      <div className="mb-1 mt-8 text-center">
        <a
          href={values.ctaUrl || "#"}
          className="inline-block rounded-md bg-orange-600 px-7 py-3.5 text-base font-bold text-white no-underline"
        >
          {values.ctaText || "Kampanyayi Incele"}
        </a>
      </div>
    </MailTemplateShell>
  );
}
