import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { FormElementsState, Game, User } from "../types";
import { useGetGamesMinimal } from "../utils/api/game";
import { useGetGameplays } from "../utils/api/gameplay";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetUsersMinimal } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

interface GameplayRow {
  _id: number;
  game: string;
  mentor: {
    _id: string;
    name: string;
  };
  playerCount: number;
  startHour: string;
  finishHour: string;
  locationName: string;
  date: string;
}

export default function NewGameplays() {
  const { t } = useTranslation();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      limit: 10,
      page: 1,
      mentor: "",
      game: "",
      location: "",
      startDate: "",
      endDate: "",
      search: "",
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [showFilters, setShowFilters] = useState(false);
  const gameplaysPayload = useGetGameplays(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  console.log("gameplaysPayload", gameplaysPayload?.data);
  const games = useGetGamesMinimal();
  const locations = useGetStoreLocations();
  const users = useGetUsersMinimal();

  const rows = useMemo(() => {
    const allRows = gameplaysPayload?.data?.map((gameplay) => {
      const foundLocation = getItem(gameplay.location, locations);
      return {
        _id: gameplay?._id || 0,
        game: (gameplay?.game as Game)?.name,
        mentor: (gameplay?.mentor as User)?.name,
        playerCount: gameplay?.playerCount,
        locationName: foundLocation?.name || "",
        startHour: gameplay?.startHour || "",
        finishHour: gameplay?.finishHour || "",
        date: gameplay?.date,
      };
    });
    return allRows || [];
  }, [gameplaysPayload, locations]);

  const columns = useMemo(
    () => [
      {
        key: t("Game"),
        isSortable: true,
        correspondingKey: "game",
      },
      {
        key: t("Game Mentor"),
        isSortable: true,
        correspondingKey: "mentor",
      },
      {
        key: t("Player Count"),
        isSortable: true,
        correspondingKey: "playerCount",
      },
      {
        key: t("Location"),
        isSortable: true,
        correspondingKey: "location",
      },
      {
        key: t("Start Hour"),
        isSortable: true,
        correspondingKey: "startHour",
      },
      {
        key: t("Finish Hour"),
        isSortable: true,
        correspondingKey: "finishHour",
      },
      {
        key: t("Date"),
        isSortable: true,
        correspondingKey: "date",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "game",
        className: "min-w-32 pr-1",
      },
      {
        key: "mentor",
        className: "min-w-20 pr-1",
      },
      { key: "playerCount" },
      { key: "locationName" },
      { key: "startHour" },
      { key: "finishHour" },
      {
        key: "date",
        className: "min-w-32",
        node: (row: GameplayRow) => {
          return formatAsLocalDate(row.date);
        },
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "mentor",
        label: t("Game Mentor"),
        options: users.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Game Mentor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "game",
        label: t("Game"),
        options: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        placeholder: t("Game"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "startDate",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endDate",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
      },
    ],
    [t, users, games, locations]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
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

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return gameplaysPayload
      ? {
          totalPages: gameplaysPayload.totalPages,
          totalRows: gameplaysPayload.totalNumber,
        }
      : null;
  }, [gameplaysPayload]);

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <GenericTable
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          outsideSearchProps={outsideSearchProps}
          isSearch={false}
          title={t("Gameplays")}
          filterPanel={filterPanel}
          filters={filters}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>
    </>
  );
}
