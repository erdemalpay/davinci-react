import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import QuestionTable from "../components/event-survey/QuestionTable";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import { Routes } from "../navigation/constants";
import { useGetEvents } from "../utils/api/event-survey";

const EventSurveyQuestions = () => {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const events = useGetEvents();
  const event = events?.find((e) => String(e._id) === eventId);

  const pageNavigations = [
    {
      name: t("Etkinlikler"),
      path: Routes.EventSurveyBuilder,
      canBeClicked: true,
    },
    {
      name: event?.name ?? t("Sorular"),
      path: "",
      canBeClicked: false,
    },
  ];

  if (!event) {
    return (
      <>
        <Header showLocationSelector={false} />
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Etkinlik bulunamadı
        </div>
      </>
    );
  }

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto mt-4">
        <QuestionTable event={event} />
      </div>
    </>
  );
};

export default EventSurveyQuestions;
