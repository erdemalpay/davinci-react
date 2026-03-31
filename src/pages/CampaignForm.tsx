import { format } from "date-fns";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { submitSurvey, useGetPublicEvent } from "../utils/api/event-survey";
import {
  EventStatus,
  QuestionType,
  SubmitSurveyPayload,
  SubmitSurveyResult,
  SurveyAnswer,
  SurveyQuestion,
} from "../types/event-survey";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const toOptionsArray = (options: string[] | string | undefined): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return String(options).split("\n").map((s) => s.trim()).filter(Boolean);
};

const CampaignForm = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data, isLoading, isError } = useGetPublicEvent(eventSlug);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitSurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.event) return;
    setIsSubmitting(true);
    setError(null);

    const surveyAnswers: SurveyAnswer[] = (
      data.questions as SurveyQuestion[]
    ).map((q) => ({
      questionId: q._id,
      questionLabel: q.label,
      answer: answers[q._id] ?? "",
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
      setError(getApiErrorMessage(err, "Bir hata oluştu, lütfen tekrar deneyin."));
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
    return <StatusScreen title="Etkinlik bulunamadı" description="Bu QR kodu geçerli bir etkinliğe ait değil." />
  }

  if (!data.available) {
    const statusMessages: Record<string, string> = {
      [EventStatus.DRAFT]: "Form henüz yayında değil.",
      [EventStatus.ARCHIVED]: "Kampanya sona erdi.",
    };
    return (
      <StatusScreen
        title="Kampanya Aktif Değil"
        description={statusMessages[data.event.status] ?? "Bu kampanya şu an aktif değil."}
      />
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Teşekkürler!</h2>
          <p className="text-sm text-gray-500 mb-6">Davinci Board Game Cafe</p>

          <div className="bg-indigo-50 rounded-xl p-6 mb-4">
            <p className="text-xs text-indigo-400 uppercase tracking-wider mb-2">Ödül Kodunuz</p>
            <p className="text-4xl font-bold tracking-[0.2em] text-indigo-700">{result.code}</p>
          </div>

          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>🎁 <span className="font-medium">{result.rewardLabel}</span></p>
            <p>⏰ {result.codeValidityDays} gün geçerli · tek kullanımlık</p>
            <p className="text-xs text-gray-400">
              Son kullanım: {format(new Date(result.expiresAt), "dd/MM/yyyy")}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700 font-medium">
              Bu kodu barista veya oyun yöneticisine söyleyin
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
            alt="Davinci Board Game Cafe"
            className="h-12 mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-800">Davinci Board Game Cafe</h1>
          <p className="text-sm text-gray-500 mt-1">Formu doldur, sürpriz ödülünü al! 🎁</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Adınız Soyadınız"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {(data.questions as SurveyQuestion[]).map((question) => (
            <div key={question._id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.type === QuestionType.SINGLE_CHOICE && (
                <div className="space-y-2">
                  {toOptionsArray(question.options).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q_${question._id}`}
                        value={opt}
                        required={question.required}
                        onChange={(e) => handleAnswerChange(question, e.target.value)}
                        className="accent-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === QuestionType.MULTI_CHOICE && (
                <div className="space-y-2">
                  {toOptionsArray(question.options).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
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
                      handleAnswerChange(question, e.target.checked ? "evet" : "hayır")
                    }
                    className="accent-indigo-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-600">{question.label}</span>
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
                E-posta adresimin pazarlama ve kampanya amaçlı kullanılmasına onay veriyorum.
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
            disabled={isSubmitting || !isValidEmail(email) || fullName.trim() === ""}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? "Gönderiliyor..." : "Formu Gönder ve Kodu Al"}
          </button>
        </form>
      </div>
    </div>
  );
};

const StatusScreen = ({ title, description }: { title: string; description: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);

export default CampaignForm;
