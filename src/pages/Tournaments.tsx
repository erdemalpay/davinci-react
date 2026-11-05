import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import EventQrModal from "../components/tournament/EventQrModal";
import TournamentTable from "../components/tournament/TournamentTable";
import { Tournament } from "../types/tournament";

const Tournaments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEventQrOpen, setIsEventQrOpen] = useState(false);

  const handleSelectTournament = (tournament: Tournament) => {
    navigate(`/tournaments/${tournament._id}`);
  };

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto mt-6">
        <div className="mb-2 flex justify-end">
          <GenericButton
            variant="outline"
            size="sm"
            onClick={() => setIsEventQrOpen(true)}
          >
            {t("Events QR")}
          </GenericButton>
        </div>
        <TournamentTable onSelectTournament={handleSelectTournament} />
      </div>
      <EventQrModal
        isOpen={isEventQrOpen}
        close={() => setIsEventQrOpen(false)}
      />
    </>
  );
};

export default Tournaments;
