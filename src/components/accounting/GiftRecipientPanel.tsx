import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GiftRecipient } from "../../types";
import { UpdatePayload } from "../../utils/api";
import {
  useGetGiftTags,
  useGiftRecipientMutations,
} from "../../utils/api/giftTracking";
import { NameInput } from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const formKeys = [
  { key: "name", type: FormKeyTypeEnum.STRING },
  { key: "tags", type: FormKeyTypeEnum.ARRAY },
  { key: "contactPerson", type: FormKeyTypeEnum.STRING },
  { key: "phone", type: FormKeyTypeEnum.STRING },
  { key: "address", type: FormKeyTypeEnum.STRING },
  { key: "instagramUrl", type: FormKeyTypeEnum.STRING },
  { key: "instagramFollowers", type: FormKeyTypeEnum.NUMBER },
  { key: "youtubeFollowers", type: FormKeyTypeEnum.NUMBER },
  { key: "isBlacklisted", type: FormKeyTypeEnum.BOOLEAN },
];

type Props = { isOpen: boolean; close: () => void; recipient?: GiftRecipient };

const GiftRecipientPanel = ({ isOpen, close, recipient }: Props) => {
  const { t } = useTranslation();
  const tags = useGetGiftTags();
  const { createGiftRecipient, updateGiftRecipient } =
    useGiftRecipientMutations();

  const inputs = useMemo(
    () => [
      NameInput({ t }),
      {
        type: InputTypes.SELECT,
        formKey: "tags",
        label: t("Tags"),
        placeholder: t("Tags"),
        options: tags
          .filter((tag) => tag.active || recipient?.tags.includes(tag._id))
          .map((tag) => ({ value: tag._id, label: tag.name })),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "contactPerson",
        label: t("Contact Person"),
        placeholder: t("Contact Person"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "phone",
        label: t("Phone"),
        placeholder: t("Phone"),
        required: false,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "address",
        label: t("Address"),
        placeholder: t("Address"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "instagramUrl",
        label: t("Instagram"),
        placeholder: t("Instagram"),
        helperText: t("Must start with https://"),
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "instagramFollowers",
        label: t("Instagram Followers"),
        placeholder: t("Instagram Followers"),
        required: false,
        isOnClearActive: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "youtubeFollowers",
        label: t("YouTube Followers"),
        placeholder: t("YouTube Followers"),
        required: false,
        isOnClearActive: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isBlacklisted",
        label: t("Blacklist"),
        required: false,
        isTopFlexRow: true,
      },
    ],
    [t, tags, recipient]
  );

  return (
    <GenericAddEditPanel
      isOpen={isOpen}
      close={close}
      inputs={inputs}
      formKeys={formKeys}
      submitItem={(item) =>
        recipient
          ? updateGiftRecipient(item as UpdatePayload<GiftRecipient>)
          : createGiftRecipient(item as Partial<GiftRecipient>)
      }
      isEditMode={!!recipient}
      itemToEdit={
        recipient ? { id: recipient._id, updates: recipient } : undefined
      }
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default GiftRecipientPanel;
