import { useTranslation } from "react-i18next";
import { PublicRoutes } from "../../navigation/constants";
import { UpdatePayload } from "../../utils/api";
import {
  EventQrForm,
  useEventQrMutations,
  useGetEventQrs,
} from "../../utils/api/eventQr";
import { printQrCode } from "../../utils/printQrCode";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

interface Props {
  isOpen: boolean;
  close: () => void;
}

const FORM_KEYS = [
  { key: "title", type: FormKeyTypeEnum.STRING },
  { key: "url", type: FormKeyTypeEnum.STRING },
  { key: "date", type: FormKeyTypeEnum.DATE },
];

// Kasadaki kalıcı QR'ın ek butonu: başlık, link ve etkinlik günü. En yeni kayıt
// düzenlenir; hiç kayıt yoksa ilki oluşturulur
const EventQrModal = ({ isOpen, close }: Props) => {
  const { t } = useTranslation();
  const eventQrs = useGetEventQrs();
  const { createEventQr, updateEventQr } = useEventQrMutations();

  // Panel başlangıç değerini açılışta bir kez alır; kayıtlar gelmeden açılmaz
  if (!isOpen || eventQrs === undefined) return null;

  const saved = eventQrs[0];

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
      upperMessage={[t("EventQrHelp")]}
      inputs={inputs}
      formKeys={FORM_KEYS}
      isEditMode
      itemToEdit={{
        id: saved?._id ?? 0,
        updates: {
          title: saved?.title ?? "",
          url: saved?.url ?? "",
          date: saved?.date ?? "",
        },
      }}
      submitItem={(item) => {
        const {
          title = "",
          url = "",
          date = "",
        } = (item as UpdatePayload<EventQrForm>).updates;
        const values = { title, url, date };
        if (saved) updateEventQr({ id: saved._id, updates: values });
        else createEventQr(values);
      }}
      isCreateCloseActive
      buttonName={t("Save")}
      additionalButtons={[
        {
          label: t("Print QR Code"),
          onClick: () =>
            printQrCode({
              url: `${window.location.origin}${PublicRoutes.Events}`,
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
