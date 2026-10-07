import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormElementsState } from "../../types";
import { useGetGames } from "../../utils/api/game";
import { useGetInventoryLocations } from "../../utils/api/inventory";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { GenericInputType, InputTypes } from "../panelComponents/shared/types";

// Seçim temizlendiğinde panel boş string bırakabilir.
const toOptionalNumber = (value: unknown) =>
  value === undefined || value === null || value === ""
    ? undefined
    : Number(value);

const NO_EXTRA_INPUTS: GenericInputType[] = [];

// Envanter ve Envanter Geçmişi sayfalarının ortak Oyun / Konum / Kod filtresi;
// sayfaya özel girdiler `extraInputs` ile eklenir (useMemo ile verilmeli).
export function useInventoryFilters(extraInputs = NO_EXTRA_INPUTS) {
  const { t } = useTranslation();
  const games = useGetGames();
  const locations = useGetInventoryLocations();
  const [showFilters, setShowFilters] = useState(false);
  const [formElements, setFormElements] = useState<FormElementsState>({});

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "game",
        label: t("Game"),
        options: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        placeholder: t("Game"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((location) => ({
          value: location._id,
          label: location.name,
        })),
        placeholder: t("Location"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "code",
        label: t("Code"),
        placeholder: t("Code"),
        required: false,
      },
      ...extraInputs,
    ],
    [games, locations, extraInputs, t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs,
      formElements,
      setFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFormElements({});
      },
    }),
    [showFilters, inputs, formElements]
  );

  const showFiltersToggle = useMemo(
    () => ({
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFilters}
          onChange={() => {
            setShowFilters(!showFilters);
          }}
        />
      ),
    }),
    [t, showFilters]
  );

  const criteria = useMemo(
    () => ({
      game: toOptionalNumber(formElements.game),
      location: toOptionalNumber(formElements.location),
      code: formElements.code?.trim().toLowerCase() as string | undefined,
    }),
    [formElements]
  );

  return { filterPanel, showFiltersToggle, criteria };
}
