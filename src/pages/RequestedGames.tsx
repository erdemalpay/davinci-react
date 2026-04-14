import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  RequestedGame,
  RequestedGameRequest,
  useGetRequestedGames,
} from "../utils/api/game";
import { formatAsLocalDate } from "../utils/format";

type RequestedGameRow = RequestedGame & {
  lastRequestedAtDisplay: string;
  bggGameIdDisplay: string;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: RequestedGameRequest[];
    collapsibleRowKeys: {
      key: string;
      node?: (row: RequestedGameRequest) => React.ReactNode;
      className?: string;
    }[];
  };
};

export default function RequestedGames() {
  const { t } = useTranslation();
  const requestedGames = useGetRequestedGames();

  const rows = useMemo<RequestedGameRow[]>(() => {
    return requestedGames.map((game) => {
      const sortedRequests = [...(game.requestList || [])].sort((a, b) => {
        const dateA = new Date(a.requestedAt).getTime();
        const dateB = new Date(b.requestedAt).getTime();
        return dateB - dateA;
      });

      const lastRequestedAt = sortedRequests[0]?.requestedAt;

      return {
        ...game,
        lastRequestedAtDisplay: lastRequestedAt
          ? formatAsLocalDate(lastRequestedAt)
          : "-",

        bggGameIdDisplay: game.bggGameId?.toString() || "-",
        collapsible: {
          collapsibleColumns: [
            { key: t("Requester Email"), isSortable: true },
            { key: t("Requested At"), isSortable: true },
          ],
          collapsibleRows: sortedRequests,
          collapsibleRowKeys: [
            {
              key: "email",
              className: "min-w-56",
              node: (row: RequestedGameRequest) => (
                <span className="text-blue-600">{row.email}</span>
              ),
            },
            {
              key: "requestedAt",
              className: "min-w-40",
              node: (row: RequestedGameRequest) => (
                <div>
                  <div>{formatAsLocalDate(row.requestedAt)}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(row.requestedAt), "HH:mm")}
                  </div>
                </div>
              ),
            },
          ],
        },
      };
    });
  }, [requestedGames, t]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true, correspondingKey: "name" },
      {
        key: t("BGG Game ID"),
        isSortable: true,
        correspondingKey: "bggGameId",
      },
      {
        key: t("Total Requests"),
        isSortable: true,
        correspondingKey: "totalRequestCount",
      },
      {
        key: t("Last Requested At"),
        isSortable: true,
        correspondingKey: "lastRequestedAtDisplay",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        className: "min-w-56 font-medium",
      },
      {
        key: "bggGameIdDisplay",
        className: "min-w-24",
      },
      {
        key: "totalRequestCount",
        className: "min-w-24",
      },
      {
        key: "lastRequestedAtDisplay",
        className: "min-w-32",
      },
    ],
    []
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <GenericTable<RequestedGameRow>
          title={t("Requested Games")}
          rows={rows}
          columns={columns}
          rowKeys={rowKeys}
          isActionsActive={false}
          isCollapsible={true}
          isPagination={false}
        />
      </div>
    </>
  );
}
