import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdOutlineCheckCircle } from "react-icons/md";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum, FormElementsState } from "../types";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";
import { isActionDisabled } from "../utils/permissions";
import {
  RequestedGame,
  RequestedGameRequest,
  RequestedGameStatus,
  useGetRequestedGames,
  useRequestedGameMutations,
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
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const requestedGamesDisabledCondition = useMemo(
    () => getItem(DisabledConditionEnum.REQUESTEDGAMES, disabledConditions),
    [disabledConditions]
  );
  const [showFilters, setShowFilters] = useState(false);
  const initialFilterPanelFormElements = useMemo<FormElementsState>(
    () => ({
      status: "requested",
    }),
    []
  );
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const selectedStatus = filterPanelFormElements.status as
    | RequestedGameStatus
    | "";
  const requestedGames = useGetRequestedGames(selectedStatus || undefined);
  const { updateRequestedGame } = useRequestedGameMutations();

  const requestedGameStatusOptions = useMemo(
    () => [
      { value: "requested", label: t("Requested") },
      { value: "available", label: t("Purchased") },
      { value: "deleted", label: t("Deleted") },
    ],
    [t]
  );

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
      { key: t("Status"), isSortable: true, correspondingKey: "status" },
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
      { key: t("Actions"), isSortable: false },
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
        key: "status",
        className: "min-w-28",
        node: (row: RequestedGameRow) => {
          const status = requestedGameStatusOptions.find(
            (option) => option.value === row.status
          );
          return (
            <span className="rounded-md bg-blue-500 px-2 py-1 text-sm font-semibold text-white">
              {status?.label ?? "-"}
            </span>
          );
        },
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
    [requestedGameStatusOptions]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: requestedGameStatusOptions,
        placeholder: t("Status"),
        required: true,
      },
    ],
    [t, requestedGameStatusOptions]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Mark Available"),
        icon: <MdOutlineCheckCircle />,
        className: "text-green-600 cursor-pointer text-2xl",
        isModal: false,
        isPath: false,
        onClick: (row: RequestedGameRow) => {
          updateRequestedGame({
            id: row._id,
            updates: { status: "available" },
          });
        },
        isDisabled: isActionDisabled(requestedGamesDisabledCondition, ActionEnum.MARK_AVAILABLE, user),
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: false,
        isPath: false,
        onClick: (row: RequestedGameRow) => {
          updateRequestedGame({
            id: row._id,
            updates: { status: "deleted" },
          });
        },
        isDisabled: isActionDisabled(requestedGamesDisabledCondition, ActionEnum.DELETE, user),
      },
    ],
    [t, updateRequestedGame, requestedGamesDisabledCondition, user]
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
          actions={actions}
          isActionsActive={true}
          isCollapsible={true}
          isPagination={false}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
}
