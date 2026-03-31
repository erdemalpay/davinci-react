import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGetAnalyticsSummary, useGetEvents, useGetMarketingConsentStats, useGetQuestionAnswers, useGetResponses, useGetQuestions } from "../utils/api/event-survey";
import { QuestionType, RewardCodeStatus, SurveyEvent, SurveyQuestion, SurveyResponse } from "../types/event-survey";
import { format } from "date-fns";

const SurveyAnalytics = () => {
  const { t, i18n } = useTranslation();
  const events = useGetEvents() as SurveyEvent[];
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | undefined>();
  const [marketingSelected, setMarketingSelected] = useState(false);

  const questions = (useGetQuestions(selectedEventId) ?? []) as SurveyQuestion[];
  const { data: questionAnswers = [] } = useGetQuestionAnswers(selectedEventId, selectedQuestionId);
  const { data: marketingStats } = useGetMarketingConsentStats(selectedEventId);
  const selectedQuestion = questions.find((q) => q._id === selectedQuestionId);

  const { data: summary, isLoading: summaryLoading } =
    useGetAnalyticsSummary(selectedEventId);

  const { data: responsesData } = useGetResponses({
    eventId: selectedEventId,
    limit: 1000,
  });
  const responses: SurveyResponse[] = responsesData?.data ?? [];

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
              setSelectedQuestionId(undefined);
              setMarketingSelected(false);
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
                  onClick={() => {
                    setSelectedQuestionId(selectedQuestionId === q._id ? undefined : q._id);
                    setMarketingSelected(false);
                  }}
                  className={`px-4 py-2 rounded-lg focus:outline-none font-medium cursor-pointer text-sm ${
                    selectedQuestionId === q._id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMarketingSelected((prev) => !prev);
                  setSelectedQuestionId(undefined);
                }}
                className={`px-4 py-2 rounded-lg focus:outline-none font-medium cursor-pointer text-sm ${
                  marketingSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black"
                }`}
              >
                {t("Marketing Consent")}
              </button>
            </div>

            {marketingSelected && marketingStats && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-800">{t("Marketing Consent")}</p>
                <ConsentDonutChart
                  answers={[
                    ...Array(marketingStats.yes).fill({ answer: "evet" }),
                    ...Array(marketingStats.no).fill({ answer: "hayır" }),
                  ]}
                  yesLabel={t("Yes")}
                  noLabel={t("No")}
                />
              </div>
            )}

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
                ) : selectedQuestion.type === QuestionType.CONSENT ? (
                  <ConsentDonutChart answers={questionAnswers} yesLabel={t("Yes")} noLabel={t("No")} />
                ) : selectedQuestion.type === QuestionType.SINGLE_CHOICE ? (
                  <SingleChoiceBarChart answers={questionAnswers} />
                ) : selectedQuestion.type === QuestionType.MULTI_CHOICE ? (
                  <MultiChoiceBarChart answers={questionAnswers} />
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
              <GenericTable
                rows={responses}
                isActionsActive={false}
                columns={[
                  { key: t("Full Name"), isSortable: true },
                  { key: t("Email"), isSortable: true },
                  { key: t("Marketing Consent"), isSortable: true },
                  { key: t("Reward"), isSortable: false },
                  { key: t("Date"), isSortable: true },
                ]}
                rowKeys={[
                  { key: "fullName" },
                  { key: "email" },
                  {
                    key: "emailMarketingConsent",
                    node: (row: SurveyResponse) =>
                      row.emailMarketingConsent ? (
                        <span className="text-green-600 text-xs font-medium">{t("Approved")}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      ),
                  },
                  {
                    key: "rewardCode",
                    node: (row: SurveyResponse) => (
                      <RewardStatusBadge rewardCode={row.rewardCode} t={t} />
                    ),
                  },
                  {
                    key: "createdAt",
                    node: (row: SurveyResponse) =>
                      format(new Date(row.createdAt), "dd/MM/yyyy HH:mm"),
                  },
                ]}
              />
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

const MultiChoiceBarChart = ({ answers }: { answers: { answer: string }[] }) => {
  const counts = answers.reduce<Record<string, number>>((acc, a) => {
    const options = a.answer.split(",").map((s) => s.trim()).filter(Boolean);
    options.forEach((opt) => {
      acc[opt] = (acc[opt] ?? 0) + 1;
    });
    return acc;
  }, {});

  const data = Object.entries(counts).map(([option, count]) => ({ option, count }));

  if (data.length === 0) return <EmptyChart />;

  const barHeight = 48;
  const chartHeight = Math.max(240, data.length * barHeight + 40);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveBar
        data={data}
        keys={["count"]}
        indexBy="option"
        layout="horizontal"
        margin={{ top: 10, right: 40, bottom: 20, left: 160 }}
        padding={0.3}
        colors={["#6366f1"]}
        axisLeft={{ tickSize: 0 }}
        axisBottom={{ tickSize: 5 }}
        labelSkipWidth={12}
        enableGridY={false}
        enableGridX
        borderRadius={4}
        theme={{ labels: { text: { fontSize: 16, fontWeight: 700 } } }}
      />
    </div>
  );
};

const SingleChoiceBarChart = ({ answers }: { answers: { answer: string }[] }) => {
  const counts = answers.reduce<Record<string, number>>((acc, a) => {
    acc[a.answer] = (acc[a.answer] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([option, count]) => ({
    option,
    count,
  }));

  if (data.length === 0) return <EmptyChart />;

  const barHeight = 48;
  const chartHeight = Math.max(240, data.length * barHeight + 60);

  return (
    <div className="w-full h-72">
      <ResponsiveBar
        data={data}
        keys={["count"]}
        indexBy="option"
        layout="vertical"
        margin={{ top: 10, right: 20, bottom: 60, left: 40 }}
        padding={0.3}
        colors={["#6366f1"]}
        axisLeft={{ tickSize: 5 }}
        axisBottom={{ tickSize: 5, tickRotation: -30 }}
        labelSkipHeight={12}
        enableGridY
        borderRadius={4}
        theme={{ labels: { text: { fontSize: 16, fontWeight: 700 } } }}
      />
    </div>
  );
};

const ConsentDonutChart = ({
  answers,
  yesLabel,
  noLabel,
}: {
  answers: { answer: string }[];
  yesLabel: string;
  noLabel: string;
}) => {
  const yesCount = answers.filter((a) => a.answer === "evet").length;
  const noCount = answers.length - yesCount;

  if (answers.length === 0) return <EmptyChart />;

  const data = [{ id: "consent", [yesLabel]: yesCount, [noLabel]: noCount }];

  return (
    <div className="w-full h-40">
      <ResponsiveBar
        data={data}
        keys={[yesLabel, noLabel]}
        indexBy="id"
        layout="horizontal"
        groupMode="stacked"
        margin={{ top: 30, right: 20, bottom: 30, left: 20 }}
        padding={0.35}
        colors={["#22c55e", "#f87171"]}
        axisLeft={null}
        axisBottom={null}
        enableGridY={false}
        borderRadius={4}
        theme={{ labels: { text: { fontSize: 16, fontWeight: 700 } } }}
        legends={[
          {
            dataFrom: "keys",
            anchor: "top",
            direction: "row",
            translateY: -25,
            itemWidth: 90,
            itemHeight: 16,
            itemTextColor: "#555",
            symbolSize: 12,
            symbolShape: "circle",
          },
        ]}
      />
    </div>
  );
};

export default SurveyAnalytics;
