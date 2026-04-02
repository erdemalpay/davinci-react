import { useNavigate } from "react-router-dom";
import EventTable from "../components/event-survey/EventTable";
import { Header } from "../components/header/Header";
import { Routes } from "../navigation/constants";
import { SurveyEvent } from "../types/event-survey";

const EventSurveyBuilder = () => {
  const navigate = useNavigate();

  const handleSelectEvent = (event: SurveyEvent) => {
    navigate(`/event-survey-builder/${event._id}`);
  };

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto mt-6">
        <EventTable onSelectEvent={handleSelectEvent} />
      </div>
    </>
  );
};

export default EventSurveyBuilder;
