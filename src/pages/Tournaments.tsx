import { useNavigate } from "react-router-dom";
import { Header } from "../components/header/Header";
import TournamentTable from "../components/tournament/TournamentTable";
import { Tournament } from "../types/tournament";

const Tournaments = () => {
  const navigate = useNavigate();

  const handleSelectTournament = (tournament: Tournament) => {
    navigate(`/tournaments/${tournament._id}`);
  };

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto mt-6">
        <TournamentTable onSelectTournament={handleSelectTournament} />
      </div>
    </>
  );
};

export default Tournaments;
