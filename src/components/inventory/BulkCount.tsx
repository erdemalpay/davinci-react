import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  useAddInventoryBoxesMutation,
  useGetInventoryGames,
  useGetInventoryLocations,
} from "../../utils/api/inventory";
import { GenericButton } from "../common/GenericButton";
import SelectInput from "../panelComponents/FormElements/SelectInput";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";

// Kafedeki açık oyunların toplu başlangıç sayımı: adet girilen her oyun için
// kutu açılır ve seçilen envanter lokasyonuna yazılır. Satış stoğuna dokunmaz.
const BulkCount = () => {
  const { t } = useTranslation();
  const games = useGetInventoryGames();
  const locations = useGetInventoryLocations();
  const { mutateAsync: addBoxes } = useAddInventoryBoxesMutation();
  const [location, setLocation] = useState<number>();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [shortCodes, setShortCodes] = useState<Record<number, string>>({});
  const [failedGames, setFailedGames] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationOptions = useMemo(
    () =>
      locations
        .filter((item) => item.active)
        .map((item) => ({ value: item._id, label: item.name })),
    [locations]
  );

  const rows = useMemo(
    () =>
      games.map((game) => ({
        ...game,
        isFailed: failedGames.includes(game._id),
      })),
    [games, failedGames]
  );

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Game short code"), isSortable: false },
      { key: t("Quantity"), isSortable: false, className: "mx-auto" },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        node: (row: (typeof rows)[number]) => (
          <span className={row.isFailed ? "text-red-600" : ""}>{row.name}</span>
        ),
      },
      {
        key: "shortCode",
        node: (row: (typeof rows)[number]) =>
          row.shortCode ? (
            <span>{row.shortCode}</span>
          ) : (
            <TextInput
              key={row._id}
              type="text"
              value={shortCodes[row._id] ?? ""}
              label=""
              placeholder={t("Game short code")}
              inputWidth="w-28"
              isDebounce={true}
              isOnClearActive={false}
              isTopFlexRow={false}
              className="w-28 h-10 text-center bg-transparent"
              onChange={(value) =>
                setShortCodes((prev) => ({ ...prev, [row._id]: value }))
              }
            />
          ),
      },
      {
        key: "quantity",
        node: (row: (typeof rows)[number]) => (
          <div className="flex text-center justify-center">
            <TextInput
              key={row._id}
              type="number"
              value={quantities[row._id] ?? 0}
              label=""
              placeholder=""
              inputWidth="w-32 md:w-40"
              isDebounce={true}
              isOnClearActive={true}
              isNumberButtonsActive={true}
              isTopFlexRow={false}
              minNumber={0}
              isMinNumber={true}
              className="w-20 h-10 text-center bg-transparent"
              onChange={(value) =>
                setQuantities((prev) => ({
                  ...prev,
                  [row._id]: Number(value) || 0,
                }))
              }
            />
          </div>
        ),
      },
    ],
    [t, quantities, shortCodes]
  );

  const submit = async () => {
    if (location === undefined) {
      toast.error(t("Select an inventory location first"));
      return;
    }
    const entries = games.filter((game) => (quantities[game._id] ?? 0) > 0);
    const missingCode = entries.filter(
      (game) => !game.shortCode && !shortCodes[game._id]?.trim()
    );
    if (missingCode.length) {
      setFailedGames(missingCode.map((game) => game._id));
      toast.error(t("Enter a short code for the games marked in red"));
      return;
    }
    setIsSubmitting(true);
    const failed: number[] = [];
    let created = 0;
    for (const game of entries) {
      try {
        const ids = await addBoxes({
          game: game._id,
          location,
          quantity: quantities[game._id],
          ...(game.shortCode
            ? {}
            : { shortCode: shortCodes[game._id].trim().toUpperCase() }),
        });
        created += ids.length;
        setQuantities((prev) => ({ ...prev, [game._id]: 0 }));
      } catch {
        failed.push(game._id);
      }
    }
    setFailedGames(failed);
    setIsSubmitting(false);
    if (created) toast.success(`${t("Boxes created")}: ${created}`);
  };

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-4">
      <div className="flex flex-row items-end gap-4">
        <div className="w-64">
          <SelectInput
            label={t("Inventory Location")}
            placeholder={t("Inventory Location")}
            options={locationOptions}
            value={
              locationOptions.find((item) => item.value === location) ?? null
            }
            onChange={(selected) =>
              setLocation((selected as { value: number } | null)?.value)
            }
          />
        </div>
        <GenericButton
          isLoading={isSubmitting}
          disabled={isSubmitting}
          onClick={submit}
        >
          {t("Create Boxes")}
        </GenericButton>
      </div>
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        title={t("Bulk Count")}
        isActionsActive={false}
      />
    </div>
  );
};

export default BulkCount;
