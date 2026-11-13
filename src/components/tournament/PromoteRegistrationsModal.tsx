import { Dialog } from "@headlessui/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TournamentRegistration } from "../../types/tournament";
import { useTournamentActions } from "../../utils/api/tournament";
import { normalizeText } from "../../utils/slug";
import { GenericButton } from "../common/GenericButton";
import { useRegistrationLabels } from "./RegistrationsTab";

interface Props {
  tournamentId: number;
  registrations: TournamentRegistration[];
  close: () => void;
}

// Turnuva günü: kimse işaretli gelmez. Ücreti alınan QR'lılar zaten katılımcı olur; buraya
// QR'ı bulamayıp ismi not alınanlar düşer, aranıp elle işaretlenir.
const PromoteRegistrationsModal = ({
  tournamentId,
  registrations,
  close,
}: Props) => {
  const { t } = useTranslation();
  const { promoteRegistrations } = useTournamentActions();
  const { confirmationLabels } = useRegistrationLabels();
  const [selected, setSelected] = useState(new Set<number>());
  const [search, setSearch] = useState("");

  // Kafede olanlar üstte; arama işaretleri bozmaz
  const visible = useMemo(() => {
    const query = normalizeText(search);
    return registrations
      .filter((r) => normalizeText(r.fullName).includes(query))
      .sort((a, b) => Number(!!b.arrivedAt) - Number(!!a.arrivedAt));
  }, [registrations, search]);

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const confirm = () => {
    promoteRegistrations({
      tournamentId,
      registrationIds: Array.from(selected),
    });
    close();
  };

  return (
    <Dialog open onClose={close}>
      <div className="z-[99999] fixed inset-0 flex items-center justify-center">
        <div
          onClick={close}
          className="absolute inset-0 bg-gray-900 bg-opacity-50"
        />
        <div className="relative bg-white rounded-md shadow w-11/12 max-w-lg max-h-[85vh] flex flex-col">
          <div className="bg-gray-100 rounded-t-md px-6 py-4">
            <p className="text-base font-semibold">
              {t("Take Participants From Registrations")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("PromoteRegistrationsHelp")}
            </p>
          </div>
          <div className="px-6 pt-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search")}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <ul className="overflow-y-auto divide-y px-6">
            {visible.map((registration) => (
              <li key={registration._id}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(registration._id)}
                    onChange={() => toggle(registration._id)}
                  />
                  <span className="flex-1">{registration.fullName}</span>
                  {registration.arrivedAt && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {t("At Cafe")}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {confirmationLabels[registration.confirmationStatus]}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t">
            <GenericButton onClick={close} variant="danger" size="sm">
              {t("Cancel")}
            </GenericButton>
            <GenericButton
              onClick={confirm}
              variant="primary"
              size="sm"
              disabled={selected.size === 0}
            >
              {t("Add Selected")} ({selected.size})
            </GenericButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PromoteRegistrationsModal;
