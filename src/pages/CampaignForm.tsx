import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  EventStatus,
  QuestionType,
  SubmitSurveyPayload,
  SubmitSurveyResult,
  SurveyAnswer,
  SurveyQuestion,
} from "../types/event-survey";
import { submitSurvey, useGetPublicEvent } from "../utils/api/event-survey";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const sanitizeFullNameInput = (value: string) =>
  value.replace(/[^\p{L}\s]/gu, "");

const copyToClipboard = (text: string, onSuccess: () => void) => {
  const fallbackCopy = () => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    onSuccess();
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
};

const toOptionsArray = (options: string[] | string | undefined): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return String(options)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
};

const CampaignForm = () => {
  const { t } = useTranslation();
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data, isLoading, isError } = useGetPublicEvent(eventSlug);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitSurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnswerChange = (
    question: SurveyQuestion,
    value: string,
    checked?: boolean
  ) => {
    if (question.type === QuestionType.MULTI_CHOICE) {
      const current = (answers[question._id] as string[]) ?? [];
      if (checked) {
        setAnswers({ ...answers, [question._id]: [...current, value] });
      } else {
        setAnswers({
          ...answers,
          [question._id]: current.filter((v) => v !== value),
        });
      }
    } else {
      setAnswers({ ...answers, [question._id]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data?.event) return;
    setError(null);

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const questions = data.questions as SurveyQuestion[];
    setIsSubmitting(true);

    const surveyAnswers: SurveyAnswer[] = questions.map((q) => ({
      questionId: q._id,
      questionLabel: q.label,
      answer:
        q.type === QuestionType.MULTI_CHOICE
          ? Array.isArray(answers[q._id])
            ? (answers[q._id] as string[])
            : []
          : answers[q._id] ?? "",
    }));

    const payload: SubmitSurveyPayload = {
      eventId: data.event._id,
      fullName,
      email,
      emailMarketingConsent,
      answers: surveyAnswers,
    };

    try {
      const res = await submitSurvey(payload);
      setResult(res);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          t("An unexpected error occurred, please try again.")
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <StatusScreen
        title={t("Event not found")}
        description={t("This QR code does not belong to a valid event.")}
      />
    );
  }

  if (!data.available) {
    const statusMessages: Record<string, string> = {
      [EventStatus.DRAFT]: t("Form is not published yet."),
      [EventStatus.ARCHIVED]: t("Campaign has ended."),
    };
    return (
      <StatusScreen
        title={t("Campaign Is Not Active")}
        description={
          statusMessages[data.event.status] ??
          t("This campaign is currently not active.")
        }
      />
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-50 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img
              src="/logo.svg"
              alt={t("Davinci")}
              className="h-14 w-14 object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {t("Thank you!")}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t("Davinci Board Game Cafe")}
          </p>

          <div className="py-4 mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              {t("Reward Code")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-bold tracking-[0.2em] text-gray-800">
                {result.code}
              </p>
              <button
                onClick={() => {
                  copyToClipboard(result.code, () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  });
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                title={t("Copy Code")}
              >
                {copied ? (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-500 font-medium mt-2">
                {t("Reward code copied!")}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>
              {t("Your reward:")}{" "}
              <span className="font-medium">{result.rewardLabel}</span>
            </p>
            <p>
              {t("Valid for {{days}} days · single use", {
                days: result.codeValidityDays,
              })}
            </p>
            <p className="text-xs text-gray-400">
              {t("Last use: {{date}}", {
                date: format(new Date(result.expiresAt), "dd/MM/yyyy"),
              })}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p
              className="text-xs font-medium"
              style={{ color: "rgb(220, 38, 38)" }}
            >
              {t("Tell this code to barista or game master")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <img
            src="/logo.svg"
            alt={t("Davinci Board Game Cafe")}
            className="h-12 mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-800">
            {t("Davinci Board Game Cafe")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("Fill out the form, get your surprise reward!")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Full Name")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("Optional")})
              </span>
            </label>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              inputMode="text"
              value={fullName}
              onChange={(e) =>
                setFullName(sanitizeFullNameInput(e.target.value))
              }
              placeholder={t("Enter full name")}
              title={t("Full name input hint")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("example@email.com")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {(data.questions as SurveyQuestion[]).map((question) => (
            <div key={question._id}>
              {question.type !== QuestionType.CONSENT && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.label}
                  {question.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              )}

              {question.type === QuestionType.SINGLE_CHOICE && (
                <div className="space-y-2">
                  {toOptionsArray(question.options).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q_${question._id}`}
                        value={opt}
                        required={question.required}
                        onChange={(e) =>
                          handleAnswerChange(question, e.target.value)
                        }
                        className="accent-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === QuestionType.MULTI_CHOICE && (
                <div className="relative space-y-2">
                  {question.required && (
                    <input
                      type="text"
                      name={`q_multi_required_${question._id}`}
                      required
                      value={
                        Array.isArray(answers[question._id]) &&
                        (answers[question._id] as string[]).length > 0
                          ? "."
                          : ""
                      }
                      onChange={() => undefined}
                      tabIndex={-1}
                      aria-hidden={true}
                      className="absolute opacity-0 w-px h-px overflow-hidden pointer-events-none"
                    />
                  )}
                  {toOptionsArray(question.options).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={opt}
                        onChange={(e) =>
                          handleAnswerChange(question, opt, e.target.checked)
                        }
                        className="accent-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === QuestionType.TEXT && (
                <input
                  type="text"
                  required={question.required}
                  onChange={(e) => handleAnswerChange(question, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              )}

              {question.type === QuestionType.CONSENT && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required={question.required}
                    onChange={(e) =>
                      handleAnswerChange(
                        question,
                        e.target.checked ? "evet" : "hayır"
                      )
                    }
                    className="accent-indigo-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-600">
                    {question.label}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                </label>
              )}
            </div>
          ))}

          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailMarketingConsent}
                onChange={(e) => setEmailMarketingConsent(e.target.checked)}
                className="accent-indigo-500 mt-0.5"
              />
              <span className="text-xs text-gray-500">
                {t(
                  "I approve the use of my email for marketing and campaign purposes."
                )}
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isValidEmail(email)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? t("processing") : t("submit_form_get_code")}
          </button>
        </form>
      </div>
    </div>
  );
};

const StatusScreen = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);

export default CampaignForm;
