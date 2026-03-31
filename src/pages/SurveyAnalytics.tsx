import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { useMemo, useState } from "react";
import { Header } from "../components/header/Header";
import { useGetAnalyticsSummary, useGetEvents, useGetResponses } from "../utils/api/event-survey";
import { SurveyEvent, SurveyResponse } from "../types/event-survey";
import { format } from "date-fns";

const SurveyAnalytics = () => {
  const events = useGetEvents() as SurveyEvent[];
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();

  const { data: summary, isLoading: summaryLoading } =
    useGetAnalyticsSummary(selectedEventId);

  const { data: responsesData } = useGetResponses({ eventId: selectedEventId, limit: 50 });
  const responses: SurveyResponse[] = responsesData?.data ?? [];

  const lineData = useMemo(() => {
    if (!summary?.dailyTrend?.length) return [];
    return [
      {
        id: "Form Gönderimi",
        data: summary.dailyTrend.map((d) => ({
          x: d._id,
          y: d.count,
        })),
      },
    ];
  }, [summary]);

  const funnelData = useMemo(() => {
    if (!summary) return [];
    return [
      { step: "Form Gönderimi", value: summary.totalResponses },
      { step: "Kod Üretildi", value: summary.totalIssued },
      { step: "Kullanıldı", value: summary.totalRedeemed },
    ];
  }, [summary]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-8 space-y-6">
        {/* Etkinlik Filtresi */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Etkinlik:</label>
          <select
            value={selectedEventId ?? ""}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Tüm Etkinlikler</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* KPI Kartları */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Toplam Katılım" value={summary.totalResponses} color="indigo" />
            <KpiCard label="Üretilen Kod" value={summary.totalIssued} color="blue" />
            <KpiCard label="Kullanılan Kod" value={summary.totalRedeemed} color="green" />
            <KpiCard label="Kullanım Oranı" value={`%${summary.redeemRate}`} color="amber" />
          </div>
        ) : null}

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Günlük Trend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Günlük Form Gönderimi (Son 30 Gün)
            </h3>
            <div className="h-56">
              {lineData.length > 0 ? (
                <ResponsiveLine
                  data={lineData}
                  margin={{ top: 10, right: 20, bottom: 50, left: 40 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: 0, max: "auto" }}
                  axisBottom={{
                    tickRotation: -45,
                    tickSize: 5,
                    format: (v) => v.slice(5),
                  }}
                  axisLeft={{ tickSize: 5 }}
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
          </div>

          {/* Dönüşüm Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Kod Dönüşüm Hunisi
            </h3>
            <div className="h-56">
              {funnelData.some((d) => d.value > 0) ? (
                <ResponsiveBar
                  data={funnelData}
                  keys={["value"]}
                  indexBy="step"
                  margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
                  padding={0.3}
                  layout="vertical"
                  colors={["#6366f1", "#3b82f6", "#22c55e"]}
                  colorBy="indexValue"
                  axisBottom={{ tickRotation: 0 }}
                  axisLeft={{ tickSize: 5 }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                />
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </div>

        {/* Son Katılımlar Tablosu */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Son Katılımlar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pazarlama İzni</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Kahve</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      Henüz katılım yok
                    </td>
                  </tr>
                ) : (
                  responses.map((r: SurveyResponse) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">{r.email}</td>
                      <td className="px-4 py-3">
                        {r.emailMarketingConsent ? (
                          <span className="text-green-600 text-xs font-medium">✓ Onaylı</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isRedeemed ? (
                          <span className="text-green-600 text-xs font-medium">
                            ☕ {r.redeemChannel === "barista" ? "Barista" : "GM"}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
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
        </div>
      </div>
    </>
  );
};

const KpiCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: "indigo" | "blue" | "green" | "amber";
}) => {
  const colorMap = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    green: "bg-green-50 border-green-100 text-green-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

const EmptyChart = () => (
  <div className="h-full flex items-center justify-center text-gray-300 text-sm">
    Henüz veri yok
  </div>
);

export default SurveyAnalytics;
