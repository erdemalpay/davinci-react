import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift } from "../../types";
import { UpdatePayload } from "../../utils/api";
import {
  useGetAccountProducts,
  useGetAllAccountProducts,
} from "../../utils/api/account/product";
import {
  useGetGiftRecipients,
  useGiftMutations,
} from "../../utils/api/giftTracking";
import { getItem } from "../../utils/getItem";
import { DateInput, ProductInput } from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import {
  GiftFormValues,
  getLabelOptions,
  giftQuantityKey,
  giftTypeLabels,
  shareStatusLabels,
  toGiftFormValues,
  toGiftPayload,
} from "./giftGroups";

const formKeys = [
  { key: "recipient", type: FormKeyTypeEnum.NUMBER },
  { key: "date", type: FormKeyTypeEnum.DATE },
  { key: "products", type: FormKeyTypeEnum.ARRAY },
  { key: "type", type: FormKeyTypeEnum.STRING },
  { key: "shareStatus", type: FormKeyTypeEnum.STRING },
  { key: "engagement", type: FormKeyTypeEnum.STRING },
  { key: "orderReference", type: FormKeyTypeEnum.STRING },
  { key: "note", type: FormKeyTypeEnum.STRING },
];

type Props = {
  isOpen: boolean;
  close: () => void;
  gift?: Gift;
  recipientId?: number;
};

const GiftPanel = ({ isOpen, close, gift, recipientId }: Props) => {
  const { t } = useTranslation();
  const recipients = useGetGiftRecipients();
  const activeProducts = useGetAccountProducts();
  const allProducts = useGetAllAccountProducts();
  // Mevcut hediyedeki pasif oyunlar düzenlemede görünmeye devam etsin
  const products = gift ? allProducts : activeProducts;
  const { createGift, updateGift } = useGiftMutations();
  const [form, setForm] = useState<GiftFormValues>({});

  const selectedRecipient = getItem(form.recipient, recipients);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "recipient",
        label: t("Recipient"),
        placeholder: t("Recipient"),
        options: recipients.map((recipient) => ({
          value: recipient._id,
          label: recipient.name,
        })),
        isDisabled: recipientId !== undefined,
        required: recipientId === undefined,
      },
      DateInput({ t }),
      {
        ...ProductInput({ products, t, isMultiple: true, required: true }),
        formKey: "products",
        label: t("Games"),
        placeholder: t("Games"),
      },
      ...(form.products ?? []).map((productId) => ({
        type: InputTypes.NUMBER,
        formKey: giftQuantityKey(productId),
        label: `${getItem(productId, products)?.name ?? productId} - ${t(
          "Quantity"
        )}`,
        placeholder: "1",
        minNumber: 1,
        required: false,
      })),
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        placeholder: t("Type"),
        options: getLabelOptions(giftTypeLabels, t),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "shareStatus",
        label: t("Share Status"),
        placeholder: t("Share Status"),
        options: getLabelOptions(shareStatusLabels, t),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "engagement",
        label: t("Engagement"),
        placeholder: t("Engagement"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "orderReference",
        label: t("Order No"),
        placeholder: t("Order No"),
        required: false,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "note",
        label: t("Note"),
        placeholder: t("Note"),
        required: false,
      },
    ],
    [t, recipients, products, recipientId, form.products]
  );

  return (
    <GenericAddEditPanel
      isOpen={isOpen}
      close={close}
      inputs={inputs}
      formKeys={formKeys}
      setForm={setForm}
      upperMessage={
        selectedRecipient?.isBlacklisted
          ? [t("This recipient is blacklisted")]
          : undefined
      }
      constantValues={{ recipient: recipientId, type: "GIFT" }}
      submitItem={(item) =>
        gift
          ? updateGift({
              id: gift._id,
              updates: toGiftPayload(
                (item as UpdatePayload<GiftFormValues>).updates
              ),
            })
          : createGift(toGiftPayload(item as GiftFormValues))
      }
      isEditMode={!!gift}
      itemToEdit={
        gift ? { id: gift._id, updates: toGiftFormValues(gift) } : undefined
      }
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default GiftPanel;
