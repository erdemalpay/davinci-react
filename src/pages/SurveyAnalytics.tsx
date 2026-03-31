import { ResponsiveLine } from "@nivo/line";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGetAnalyticsSummary, useGetEvents, useGetQuestionAnswers, useGetResponses, useGetQuestions } from "../utils/api/event-survey";
import { QuestionType, RewardCodeStatus, SurveyEvent, SurveyQuestion, SurveyResponse } from "../types/event-survey";
import { format } from "date-fns";

const SurveyAnalytics = () => {
  const { t, i18n } = useTranslation();
  const events = useGetEvents() as SurveyEvent[];
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [responsesPage, setResponsesPage] = useState(1);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | undefined>();

  const questions = (useGetQuestions(selectedEventId) ?? []) as SurveyQuestion[];
  const { data: questionAnswers = [] } = useGetQuestionAnswers(selectedEventId, selectedQuestionId);
  const selectedQuestion = questions.find((q) => q._id === selectedQuestionId);

  const { data: summary, isLoading: summaryLoading } =
    useGetAnalyticsSummary(selectedEventId);

  const { data: responsesData } = useGetResponses({ eventId: selectedEventId, limit: 10, page: responsesPage });
  const responses: SurveyResponse[] = responsesData?.data ?? [];
  const responsesTotal = responsesData?.total ?? 0;
  const responsesLimit = responsesData?.limit ?? 50;
  const totalPages = Math.ceil(responsesTotal / responsesLimit);

  const lineData = useMemo(() => {
    if (!summary?.dailyTrend?.length) return [];
    return [
      {
        id: t("Form Submission"),
        data: summary.dailyTrend.map((d) => ({
          x: d._id,
          y: d.count,
        })),
      },
    ];
  }, [summary, i18n.language, t]);
  useMemo(() => {
    if (!summary) return [];
    return [
      { step: t("Form Submission"), value: summary.totalResponses },
      { step: t("Code Generated"), value: summary.totalIssued },
      { step: t("Used"), value: summary.totalRedeemed },
    ];
  }, [summary, i18n.language, t]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-8 space-y-6">
        {/* Etkinlik Filtresi */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">{t("Event")}:</label>
          <select
            value={selectedEventId ?? ""}
            onChange={(e) => {
              setSelectedEventId(e.target.value ? Number(e.target.value) : undefined);
              setResponsesPage(1);
              setSelectedQuestionId(undefined);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          >
            <option value="">{t("All Events")}</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedEventId && (
          <div className="flex items-center justify-center py-20 text-gray-900 text-lg font-medium">
            {t("Please select an event to view analytics")}
          </div>
        )}

        {/* KPI Kartları */}
        {selectedEventId && summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label={t("Total Participation")} value={summary.totalResponses} color="indigo" />
            <KpiCard label={t("Generated Code")} value={summary.totalIssued} color="blue" />
            <KpiCard label={t("Used Code")} value={summary.totalRedeemed} color="green" />
            <KpiCard label={t("Usage Rate")} value={`%${summary.redeemRate}`} color="amber" />
          </div>
        ) : null}

        {/* Günlük Trend Grafiği */}
        {selectedEventId && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setChartOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-700">
                {t("Daily Form Submission (Last 30 Days)")}
              </h3>
              {chartOpen ? (
                <MdKeyboardArrowDown className="text-gray-400 text-lg" />
              ) : (
                <MdKeyboardArrowRight className="text-gray-400 text-lg" />
              )}
            </button>
            {chartOpen && (
              <div className="p-5 h-72">
                {lineData.length > 0 ? (
                  <ResponsiveLine
                    data={lineData}
                    margin={{ top: 10, right: 20, bottom: 65, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{ type: "linear", min: 0, max: "auto" }}
                    axisBottom={{
                      tickRotation: -45,
                      tickSize: 5,
                      format: (v) => v.slice(5),
                      legend: t("Date"),
                      legendOffset: 55,
                      legendPosition: "middle",
                    }}
                    axisLeft={{
                      tickSize: 5,
                      legend: t("Survey Count"),
                      legendOffset: -50,
                      legendPosition: "middle",
                    }}
                    pointSize={6}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    enableArea
                    colors={["#6366f1"]}
                    useMesh
                  />
                ) : (
                  <EmptyChart />
                )}
              </div>
            )}
          </div>
        )}

        {/* Soru Analitik Bölümü */}
        {selectedEventId && questions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={q._id}
                  type="button"
                  onClick={() =>
                    setSelectedQuestionId(selectedQuestionId === q._id ? undefined : q._id)
                  }
                  className={`px-4 py-2 rounded-lg focus:outline-none font-medium cursor-pointer text-sm ${
                    selectedQuestionId === q._id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {selectedQuestion && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-800">{selectedQuestion.label}</p>
                {selectedQuestion.type === QuestionType.TEXT ? (
                  <GenericTable
                    rows={questionAnswers}
                    isActionsActive={false}
                    isSearch={false}
                    columns={[
                      { key: t("Email"), isSortable: true },
                      { key: t("Answer"), isSortable: false },
                    ]}
                    rowKeys={[
                      { key: "email" },
                      { key: "answer" },
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    {t("Chart will be shown here")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Katılımcı Listesi Tablosu */}
        {selectedEventId && <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setParticipantsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-700">
              {t("Participant List")}
            </h3>
            {participantsOpen ? (
              <MdKeyboardArrowDown className="text-gray-400 text-lg" />
            ) : (
              <MdKeyboardArrowRight className="text-gray-400 text-lg" />
            )}
          </button>
          {participantsOpen && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("Full Name")}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("Email")}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("Marketing Consent")}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("Reward")}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("Date")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {responses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                          {t("No participants yet")}
                        </td>
                      </tr>
                    ) : (
                      responses.map((r: SurveyResponse) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.fullName}</td>
                          <td className="px-4 py-3 text-gray-500">{r.email}</td>
                          <td className="px-4 py-3">
                            {r.emailMarketingConsent ? (
                              <span className="text-green-600 text-xs font-medium">{t("Approved")}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <RewardStatusBadge rewardCode={r.rewardCode} t={t} />
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {format(new Date(r.createdAt), "dd/MM/yyyy HH:mm")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {(responsesPage - 1) * responsesLimit + 1}–{Math.min(responsesPage * responsesLimit, responsesTotal)} / {responsesTotal}
                  </span>
                  <button
                    type="button"
                    onClick={() => setResponsesPage((p) => p - 1)}
                    disabled={responsesPage === 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <MdKeyboardArrowLeft className="text-lg text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponsesPage((p) => p + 1)}
                    disabled={responsesPage === totalPages}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <MdKeyboardArrowRight className="text-lg text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>}
      </div>
    </>
  );
};

const KpiCard = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
  color: "indigo" | "blue" | "green" | "amber";
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col items-center justify-center text-center">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const EmptyChart = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full flex items-center justify-center text-gray-300 text-sm">
      {t("No data yet")}
    </div>
  );
};

const RewardStatusBadge = ({
  rewardCode,
  t,
}: {
  rewardCode: SurveyResponse["rewardCode"];
  t: (key: string) => string;
}) => {
  if (!rewardCode) return <span className="text-gray-400 text-xs">—</span>;

  if (rewardCode.status === RewardCodeStatus.REDEEMED) {
    return <span className="text-xs">{t("Used")}</span>;
  }

  if (rewardCode.status === RewardCodeStatus.EXPIRED) {
    return <span className="text-xs">{t("Expired")}</span>;
  }

  // ISSUED
  return <span className="text-xs">{t("Issued")} · {rewardCode.code}</span>;
};

export default SurveyAnalytics;
