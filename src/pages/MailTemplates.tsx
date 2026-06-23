import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineSave } from "react-icons/md";
import { toast } from "react-toastify";
import {
  MailTemplatePreview,
  getInitialMailTemplateValues,
  getRequiredMailTemplateParameters,
  mailTemplateOptions,
  mailTemplateParameterDefinitions,
  type MailTemplateParameterDefinition,
  type MailTemplateValues,
} from "../components/mailTemplates";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { H6 } from "../components/panelComponents/Typography";
import { OptionType } from "../types";
import { Paths } from "../utils/api/factory";
import {
  MailDraftStatus,
  MailType,
  useMailDraftMutations,
} from "../utils/api/mail";

const getInputType = (type: MailTemplateParameterDefinition["type"]) => {
  if (type === "email" || type === "url" || type === "date") return type;
  return "text";
};

const MailTemplates = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { createMailDraft } = useMailDraftMutations();
  const [mailType, setMailType] = useState<MailType>(MailType.CUSTOMER_MESSAGE);
  const [draftName, setDraftName] = useState("");
  const [subject, setSubject] = useState("");
  const [recipients, setRecipients] = useState("");
  const [valuesByType, setValuesByType] = useState<
    Record<MailType, MailTemplateValues>
  >(() =>
    mailTemplateOptions.reduce<Record<MailType, MailTemplateValues>>(
      (acc, option) => {
        acc[option.value] = getInitialMailTemplateValues(option.value);
        return acc;
      },
      {} as Record<MailType, MailTemplateValues>
    )
  );

  const definitions = mailTemplateParameterDefinitions[mailType];
  const values = valuesByType[mailType];

  const mailTypeSelectOptions = useMemo(
    () =>
      mailTemplateOptions
        .filter((option) => option.value !== MailType.BACK_IN_STOCK)
        .map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
    [t]
  );

  const selectedMailTypeOption = mailTypeSelectOptions.find(
    (option) => option.value === mailType
  );

  const missingRequiredParameters = useMemo(
    () =>
      getRequiredMailTemplateParameters(mailType).filter(
        (key) => !values[key]?.trim()
      ),
    [mailType, values]
  );

  const updateValue = (key: string, value: string) => {
    setValuesByType((prev) => ({
      ...prev,
      [mailType]: {
        ...prev[mailType],
        [key]: value,
      },
    }));
  };

  const resetDraft = () => {
    setValuesByType((prev) => ({
      ...prev,
      [mailType]: getInitialMailTemplateValues(mailType),
    }));
  };

  const saveDraft = () => {
    const recipientList = recipients
      .split(",")
      .map((recipient) => recipient.trim())
      .filter(Boolean);

    createMailDraft(
      {
        name: draftName,
        mailType,
        subject,
        variables: values,
        recipients: recipientList,
        status: MailDraftStatus.DRAFT,
      },
      {
        onSuccess: () => {
          toast.success(t("Mail draft saved"));
          queryClient.invalidateQueries({ queryKey: [`${Paths.Mail}/drafts`] });
        },
      }
    );
  };

  const isSaveDisabled =
    !draftName.trim() || missingRequiredParameters.length > 0;

  const draftPayloadPreview = {
    mailType,
    name: draftName,
    subject,
    recipients: recipients
      .split(",")
      .map((recipient) => recipient.trim())
      .filter(Boolean),
    variables: values,
  };

  return (
    <div className="w-[95%] mx-auto my-6">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t("Mail Templates")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("Create a draft and preview how the email will look.")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-[260px]">
            <SelectInput
              value={selectedMailTypeOption ?? null}
              options={mailTypeSelectOptions}
              onChange={(option) => {
                const selected = option as OptionType | null;
                if (selected) {
                  setMailType(selected.value as MailType);
                }
              }}
              placeholder={t("Mail Template")}
              isSortDisabled={true}
            />
          </div>
          <button
            type="button"
            onClick={resetDraft}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("Reset")}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaveDisabled}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <MdOutlineSave className="text-lg" />
            {t("Save Draft")}
          </button>
        </div>
      </div>

      {missingRequiredParameters.length > 0 && (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {t("Missing required fields")}: {missingRequiredParameters.join(", ")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,460px)_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {t("Draft Parameters")}
            </h3>
            <span className="text-xs text-gray-500">
              {definitions.length} {t("fields")}
            </span>
          </div>
          <div className="mb-5 space-y-4 border-b border-gray-200 pb-5">
            <TextInput
              type="text"
              label={t("Draft Name")}
              value={draftName}
              onChange={setDraftName}
              placeholder={t("Draft Name")}
              requiredField={true}
              onClear={() => setDraftName("")}
            />
            <TextInput
              type="text"
              label={t("Subject")}
              value={subject}
              onChange={setSubject}
              placeholder={t("Subject")}
              onClear={() => setSubject("")}
            />
            <TextInput
              type="text"
              label={t("Recipients")}
              value={recipients}
              onChange={setRecipients}
              placeholder={t("email1@example.com, email2@example.com")}
              onClear={() => setRecipients("")}
            />
          </div>
          <div className="space-y-4">
            {definitions.map((definition) => (
              <div key={definition.key} className="block">
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex-1">
                    {definition.type === "multiline" ? (
                      <H6>
                        {t(definition.label)}
                        {definition.required && (
                          <span className="text-red-400">* </span>
                        )}
                      </H6>
                    ) : null}
                  </div>
                </div>
                {definition.type === "multiline" ? (
                  <textarea
                    id="textarea-input"
                    value={values[definition.key] ?? ""}
                    onChange={(event) =>
                      updateValue(definition.key, event.target.value)
                    }
                    placeholder={definition.example}
                    className="min-h-[110px] w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                ) : (
                  <TextInput
                    type={getInputType(definition.type)}
                    label={t(definition.label)}
                    value={values[definition.key] ?? ""}
                    onChange={(value) => updateValue(definition.key, value)}
                    placeholder={definition.example}
                    requiredField={definition.required}
                    onClear={() => updateValue(definition.key, "")}
                  />
                )}
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {t(definition.description)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-600">
              {t("Draft Payload")}
            </p>
            <pre className="max-h-48 overflow-auto text-xs text-gray-500">
              {JSON.stringify(draftPayloadPreview, null, 2)}
            </pre>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-base font-semibold text-gray-900">
              {t("Preview")}
            </h3>
          </div>
          <div className="max-h-[calc(100vh-260px)] min-h-[520px] overflow-auto bg-gray-100">
            <MailTemplatePreview mailType={mailType} values={values} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailTemplates;
