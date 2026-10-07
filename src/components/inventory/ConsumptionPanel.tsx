import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConsumptStockPayload } from "../../utils/api/account/stock";
import {
  useGetInventoryLinkableGames,
  useGetInventoryLocations,
} from "../../utils/api/inventory";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyType,
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../panelComponents/shared/types";

type ConsumptForm = {
  product?: string;
  quantity?: number;
  location?: number | string;
  addToInventory?: boolean;
  inventoryLocation?: number;
  inventoryShortCode?: string;
};

// Envanter form anahtarları gövdeye sızmaz; `inventory` yalnızca onay kutusu
// işaretli ve lokasyon seçiliyken eklenir (aksi halde gövde bugünküyle aynıdır).
function buildConsumptPayload(form: ConsumptForm) {
  const { addToInventory, inventoryLocation, inventoryShortCode, ...rest } =
    form;
  if (!addToInventory || inventoryLocation === undefined) return rest;
  return {
    ...rest,
    inventory: {
      location: inventoryLocation,
      ...(inventoryShortCode
        ? { shortCode: inventoryShortCode.trim().toUpperCase() }
        : {}),
    },
  };
}

const inventoryFormKeys = [
  { key: "addToInventory", type: FormKeyTypeEnum.BOOLEAN },
  { key: "inventoryLocation", type: FormKeyTypeEnum.NUMBER },
  { key: "inventoryShortCode", type: FormKeyTypeEnum.STRING },
];

// Ürün değişince onay ve kısaltma sıfırlanır (TAB girdisi additionalOnChange
// çağırmaz, invalidateKeys çağırır). Ürün girdisine `invalidateKeys` olarak verilir.
const productInvalidateKeys = [
  { key: "addToInventory", defaultValue: false },
  { key: "inventoryShortCode", defaultValue: "" },
];

function useInventoryConsumption() {
  const { t } = useTranslation();
  const linkableGames = useGetInventoryLinkableGames();
  const allLocations = useGetInventoryLocations();
  const [form, setForm] = useState<ConsumptForm>({});
  const game = form.product
    ? linkableGames.find((g) => g.product === form.product)
    : undefined;
  const activeLocations = useMemo(
    () => allLocations.filter((l) => l.active),
    [allLocations]
  );
  const isChecked = !!game && !!form.addToInventory;
  const needsShortCode = isChecked && !game?.shortCode;

  // `isDisabled` alanı gizler; gizli alan zorunlu sayılmasın diye `required` da koşullu.
  const inputs = useMemo<GenericInputType[]>(
    () => [
      {
        type: InputTypes.CHECKBOX,
        formKey: "addToInventory",
        label: t("Add to inventory"),
        placeholder: t("Add to inventory"),
        required: false,
        isDisabled: !game,
      },
      {
        type: InputTypes.SELECT,
        formKey: "inventoryLocation",
        label: t("Inventory Location"),
        options: activeLocations.map((l) => ({
          value: l._id,
          label: l.name,
        })),
        placeholder: t("Inventory Location"),
        required: isChecked,
        isDisabled: !isChecked,
      },
      {
        type: InputTypes.TEXT,
        formKey: "inventoryShortCode",
        label: t("Game short code"),
        placeholder: t("Game short code"),
        required: needsShortCode,
        isDisabled: !needsShortCode,
      },
    ],
    [t, game, activeLocations, isChecked, needsShortCode]
  );

  return { inputs, setForm };
}

type Props = {
  inputs: GenericInputType[];
  formKeys: FormKeyType[];
  submit: (payload: ConsumptStockPayload) => void;
  close: () => void;
  isOpen: boolean;
  buttonName: string;
  generalClassName?: string;
  topClassName?: string;
  constantValues?: Record<string, unknown>;
};

// Tüketim modalı + "Envantere ekle" alanları. Hook yalnızca modal açıkken
// (bileşen bağlandığında) çalışır; form state'i sayfayı yeniden çizmez.
export function ConsumptionPanel({ inputs, formKeys, submit, ...rest }: Props) {
  const { inputs: inventoryInputs, setForm } = useInventoryConsumption();
  return (
    <GenericAddEditPanel
      {...rest}
      inputs={[
        ...inputs.map((input) =>
          input.formKey === "product"
            ? { ...input, invalidateKeys: productInvalidateKeys }
            : input
        ),
        ...inventoryInputs,
      ]}
      formKeys={[...formKeys, ...inventoryFormKeys]}
      setForm={setForm}
      submitItem={
        ((form: ConsumptForm) =>
          submit(buildConsumptPayload(form) as ConsumptStockPayload)) as any
      }
    />
  );
}
