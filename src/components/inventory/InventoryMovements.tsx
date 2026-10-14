import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { InventoryMovementType } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  useGetInventoryLocations,
  useGetInventoryMovements,
} from "../../utils/api/inventory";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { InputTypes } from "../panelComponents/shared/types";
import { useInventoryFilters } from "./useInventoryFilters";

const InventoryMovements = () => {
  const { t } = useTranslation();
  const movements = useGetInventoryMovements();
  const games = useGetGames();
  const locations = useGetInventoryLocations();
  const users = useGetUsersMinimal();

  const typeLabels = useMemo<Record<InventoryMovementType, string>>(
    () => ({
      CREATE: t("Added to inventory"),
      MOVE: t("Moved"),
      DEACTIVATE: t("Removed"),
      CANCEL: t("Cancelled"),
    }),
    [t]
  );

  const typeFilterInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: Object.entries(typeLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Type"),
        required: false,
      },
    ],
    [t, typeLabels]
  );
  const { filterPanel, showFiltersToggle, criteria } =
    useInventoryFilters(typeFilterInputs);
  const type = filterPanel.formElements.type;

  const rows = useMemo(() => {
    const { game, location, code } = criteria;
    const locationName = (id?: number) =>
      id === undefined ? "" : getItem(id, locations)?.name ?? id;
    return movements
      .filter(
        (movement) =>
          (!type || movement.type === type) &&
          (game === undefined || movement.game === game) &&
          (location === undefined ||
            movement.fromLocation === location ||
            movement.toLocation === location) &&
          (!code || movement.box.toLowerCase().includes(code))
      )
      .map((movement) => ({
        ...movement,
        gameName: getItem(movement.game, games)?.name ?? "",
        formattedDate: formatAsLocalDate(movement.createdAt),
        hour: format(new Date(movement.createdAt), "HH:mm"),
        typeLabel: typeLabels[movement.type],
        fromName: locationName(movement.fromLocation),
        toName: locationName(movement.toLocation),
        userName: getItem(movement.user, users)?.name ?? "",
      }));
  }, [movements, games, locations, users, typeLabels, criteria, type]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: false },
      { key: t("Hour"), isSortable: false },
      { key: t("Game"), isSortable: false },
      { key: t("Box"), isSortable: false },
      { key: t("Type"), isSortable: false },
      { key: t("From"), isSortable: false },
      { key: t("To"), isSortable: false },
      { key: t("Note"), isSortable: false },
      { key: t("User"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "formattedDate" },
      { key: "hour" },
      { key: "gameName" },
      { key: "box" },
      { key: "typeLabel" },
      { key: "fromName" },
      { key: "toName" },
      { key: "note" },
      { key: "userName" },
    ],
    []
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        filterPanel={filterPanel}
        filters={[showFiltersToggle]}
        title={t("Inventory History")}
        isActionsActive={false}
      />
    </div>
  );
};

export default InventoryMovements;
