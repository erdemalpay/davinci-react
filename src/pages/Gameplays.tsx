import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { FormElementsState, Game } from "../types";
import { useGetGames } from "../utils/api/game";
import { useGetGameplays } from "../utils/api/gameplay";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";
import { LocationInput } from "../utils/panelInputs";

interface GameplayRow {
  _id: number;
  game: string;
  mentor: string;
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
    });
  const [tableKey, setTableKey] = useState(0);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [showFilters, setShowFilters] = useState(false);
  const gameplaysPayload = useGetGameplays(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const games = useGetGames();
  const locations = useGetStoreLocations();
  const users = useGetUsers();
  const allRows = gameplaysPayload?.data?.map((gameplay) => {
    const foundLocation = getItem(gameplay.location, locations);
    return {
      _id: gameplay?._id || 0,
      game: (gameplay?.game as Game)?.name,
      mentor: gameplay?.mentor?.name,
      playerCount: gameplay?.playerCount,
      locationName: foundLocation?.name || "",
      startHour: gameplay?.startHour || "",
      finishHour: gameplay?.finishHour || "",
      date: gameplay?.date,
    };
  });
  const [rows, setRows] = useState<GameplayRow[]>(allRows || []);

  const columns = [
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
  ];
  const rowKeys = [
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
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "mentor",
      label: t("Game Mentor"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
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
    LocationInput({ locations: locations, required: true }),
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
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const outsideSort = {
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };
  const pagination = gameplaysPayload
    ? {
        totalPages: gameplaysPayload.totalPages,
        totalRows: gameplaysPayload.totalNumber,
      }
    : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);
  useEffect(() => {
    setRows(allRows || []);
    setTableKey((prev) => prev + 1);
  }, [gameplaysPayload, locations]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          title={t("GamePlays")}
          filterPanel={filterPanel}
          filters={filters}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
}
