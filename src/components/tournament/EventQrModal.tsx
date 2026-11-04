import { useTranslation } from "react-i18next";
import { EventQrSetting } from "../../types/index";
import { UpdatePayload } from "../../utils/api";
import {
  EventQrForm,
  useGetEventQr,
  useSaveEventQr,
} from "../../utils/api/eventQr";
import { formatDateInTurkey } from "../../utils/format";
import { printQrCode } from "../../utils/printQrCode";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

interface Props {
  isOpen: boolean;
  close: () => void;
}

// Backend'de tek kayıt tutulur; id yalnızca panelin düzenleme modu için gerekir
const EVENT_QR_ID = 1;

const FORM_KEYS = [
  { key: "title", type: FormKeyTypeEnum.STRING },
  { key: "url", type: FormKeyTypeEnum.STRING },
  { key: "date", type: FormKeyTypeEnum.DATE },
];

// Kasadaki kalıcı QR'ın ek butonu: başlık, link ve son gün
const EventQrModal = ({ isOpen, close }: Props) => {
  const { t } = useTranslation();
  const data = useGetEventQr();
  const { mutate: save } = useSaveEventQr();

  // Panel başlangıç değerini açılışta bir kez alır; kayıtlı ayar gelmeden açılmaz
  if (!isOpen || data === undefined) return null;

  const saved: EventQrSetting | undefined = data || undefined;
  const isExpired =
    !!saved?.date && saved.date <= formatDateInTurkey(new Date());

  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "title",
      label: t("Button Title"),
      placeholder: t("Button Title"),
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "url",
      label: t("Link"),
      placeholder: "https://",
      required: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Event Day"),
      placeholder: t("Event Day"),
      required: false,
      isDatePicker: true,
    },
  ];

  return (
    <GenericAddEditPanel<EventQrForm>
      isOpen
      close={close}
      header={t("Events QR")}
      upperMessage={[t("EventQrHelp"), ...(isExpired ? [t("Expired")] : [])]}
      inputs={inputs}
      formKeys={FORM_KEYS}
      isEditMode
      itemToEdit={{
        id: EVENT_QR_ID,
        updates: {
          title: saved?.title ?? "",
          url: saved?.url ?? "",
          date: saved?.date ?? "",
        },
      }}
      submitItem={(item) => {
        const { title = "", url = "", date = "" } = (
          item as UpdatePayload<EventQrForm>
        ).updates;
        save({ title, url, date });
      }}
      isCreateCloseActive
      buttonName={t("Save")}
      additionalButtons={[
        {
          label: t("Print QR Code"),
          onClick: () =>
            printQrCode({
              url: `${window.location.origin}/etkinlikler`,
              eventName: t("Events"),
            }),
        },
      ]}
      topClassName="flex flex-col gap-2"
      centerOnMobile
    />
  );
};

export default EventQrModal;
