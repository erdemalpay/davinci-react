import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAddInventoryBoxesMutation,
  useGetInventoryLinkableGames,
  useGetInventoryLocations,
} from "../../utils/api/inventory";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type AddBoxForm = {
  game?: number | string;
  location?: number;
  quantity?: number;
  shortCode?: string;
};

const formKeys = [
  { key: "game", type: FormKeyTypeEnum.NUMBER },
  { key: "location", type: FormKeyTypeEnum.NUMBER },
  { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  { key: "shortCode", type: FormKeyTypeEnum.STRING },
];

type Props = { isOpen: boolean; close: () => void };

// Envanter sayfasından elle kutu ekleme (tüketim kaydı gerektirmez).
const AddBoxPanel = ({ isOpen, close }: Props) => {
  const { t } = useTranslation();
  const linkableGames = useGetInventoryLinkableGames();
  const locations = useGetInventoryLocations();
  const { mutate: addBoxes } = useAddInventoryBoxesMutation();
  const [form, setForm] = useState<AddBoxForm>({});
  const game = linkableGames.find((g) => g._id === Number(form.game));
  const needsShortCode = !!game && !game.shortCode;

  // `isDisabled` alanı gizler; gizli alan zorunlu sayılmasın diye `required` da koşullu.
  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "game",
        label: t("Game"),
        options: linkableGames.map((g) => ({ value: g._id, label: g.name })),
        placeholder: t("Game"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Inventory Location"),
        options: locations
          .filter((location) => location.active)
          .map((location) => ({ value: location._id, label: location.name })),
        placeholder: t("Inventory Location"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        minNumber: 1,
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "shortCode",
        label: t("Game short code"),
        placeholder: t("Game short code"),
        required: needsShortCode,
        isDisabled: !needsShortCode,
      },
    ],
    [t, linkableGames, locations, game, needsShortCode]
  );

  return (
    <GenericAddEditPanel
      isOpen={isOpen}
      close={close}
      header={t("Add Product")}
      inputs={inputs}
      formKeys={formKeys}
      setForm={setForm}
      submitItem={
        ((values: AddBoxForm) =>
          addBoxes({
            game: Number(values.game),
            location: Number(values.location),
            quantity: Number(values.quantity),
            ...(needsShortCode
              ? { shortCode: values.shortCode?.trim().toUpperCase() }
              : {}),
          })) as any
      }
      buttonName={t("Add Product")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default AddBoxPanel;
