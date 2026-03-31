import { useState } from "react";
import { MdOutlineEvent, MdOutlineQuestionAnswer } from "react-icons/md";
import EventTable from "../components/event-survey/EventTable";
import QuestionTable from "../components/event-survey/QuestionTable";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { SurveyEvent } from "../types/event-survey";

const EventSurveyBuilder = () => {
  const [selectedEvent, setSelectedEvent] = useState<SurveyEvent | undefined>();
  const [activeTab, setActiveTab] = useState(0);

  const handleSelectEvent = (event: SurveyEvent) => {
    setSelectedEvent(event);
    setActiveTab(1);
  };

  const tabs = [
    {
      number: 0,
      label: "Etkinlikler",
      icon: <MdOutlineEvent className="text-lg" />,
      content: (
        <EventTable
          onSelectEvent={handleSelectEvent}
          selectedEventId={selectedEvent?._id}
        />
      ),
      isDisabled: false,
    },
    {
      number: 1,
      label: "Sorular",
      icon: <MdOutlineQuestionAnswer className="text-lg" />,
      content: selectedEvent ? (
        <QuestionTable event={selectedEvent} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MdOutlineEvent className="text-5xl mb-3" />
          <p className="text-sm">Soru yönetmek için sol tabdan bir etkinlik seçin</p>
        </div>
      ),
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

export default EventSurveyBuilder;
