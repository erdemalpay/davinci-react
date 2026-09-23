import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import {
  ConfirmationStatus,
  RegistrationSource,
  Tournament,
  TournamentRegistration,
} from "../../types/tournament";
import {
  useGetTournamentRegistrations,
  useTournamentActions,
} from "../../utils/api/tournament";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

// "0555 123 45 67" → "905551234567" (wa.me ülke koduyla ister)
const toWhatsappNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  return `90${digits.replace(/^0/, "")}`;
};

export const useRegistrationLabels = () => {
  const { t } = useTranslation();
  const sourceLabels: Record<RegistrationSource, string> = {
    [RegistrationSource.QR]: "QR",
    [RegistrationSource.SOCIAL]: t("Social Media"),
    [RegistrationSource.OTHER]: t("Unknown"),
  };
  const confirmationLabels: Record<ConfirmationStatus, string> = {
    [ConfirmationStatus.PENDING]: t("Pending"),
    [ConfirmationStatus.CONFIRMED]: t("Confirmed"),
    [ConfirmationStatus.DECLINED]: t("Not Coming"),
    [ConfirmationStatus.UNREACHABLE]: t("Unreachable"),
  };
  return { sourceLabels, confirmationLabels };
};

interface Props {
  tournament: Tournament;
}

const RegistrationsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const registrations = useGetTournamentRegistrations(tournament._id);
  const { updateConfirmation } = useTournamentActions();
  const { sourceLabels, confirmationLabels } = useRegistrationLabels();
  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] = useState<
    Record<string, string>
  >({ source: "", confirmationStatus: "" });

  const rows = useMemo(
    () =>
      registrations.filter(
        (r) =>
          (!filterFormElements.source ||
            r.source === filterFormElements.source) &&
          (!filterFormElements.confirmationStatus ||
            r.confirmationStatus === filterFormElements.confirmationStatus)
      ),
    [registrations, filterFormElements]
  );

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Phone"), isSortable: false },
    { key: t("Email"), isSortable: false },
    { key: t("Source"), isSortable: true },
    { key: t("Confirmation"), isSortable: true },
    { key: t("Contact"), isSortable: false },
  ];

  const rowKeys = [
    { key: "fullName" },
    { key: "phone" },
    { key: "email", node: (row: TournamentRegistration) => row.email ?? "-" },
    {
      key: "source",
      node: (row: TournamentRegistration) => sourceLabels[row.source],
    },
    {
      key: "confirmationStatus",
      node: (row: TournamentRegistration) => (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={row.confirmationStatus}
          onChange={(e) =>
            updateConfirmation({
              registrationId: row._id,
              confirmationStatus: e.target.value as ConfirmationStatus,
            })
          }
        >
          {Object.entries(confirmationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "contact",
      node: (row: TournamentRegistration) => (
        <div className="flex items-center gap-3 text-xl">
          <a
            href={`https://wa.me/${toWhatsappNumber(row.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="text-green-600 hover:text-green-800"
            title="WhatsApp"
          >
            <FaWhatsapp />
          </a>
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              className="text-blue-500 hover:text-blue-700"
              title={t("Email")}
            >
              <MdOutlineEmail />
            </a>
          )}
        </div>
      ),
    },
  ];

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: [
      {
        type: InputTypes.SELECT,
        formKey: "source",
        label: t("Source"),
        options: Object.entries(sourceLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Source"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "confirmationStatus",
        label: t("Confirmation"),
        options: Object.entries(confirmationLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Confirmation"),
        required: false,
      },
    ],
    formElements: filterFormElements,
    setFormElements: setFilterFormElements,
    closeFilters: () => setShowFilters(false),
  };

  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFilters}
          onChange={() => setShowFilters(!showFilters)}
        />
      ),
    },
  ];

  return (
    <GenericTable
      rowKeys={rowKeys}
      columns={columns}
      rows={rows}
      isActionsActive={false}
      title={t("Registrations")}
      filterPanel={filterPanel}
      filters={filters}
    />
  );
};

export default RegistrationsTab;
