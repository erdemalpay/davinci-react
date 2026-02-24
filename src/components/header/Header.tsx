import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineNewReleases, MdOutlineNotificationsNone } from "react-icons/md";
import { Link } from "react-router-dom";
import { ReleaseNote } from "../../types";
import { DateInput } from "../common/DateInput2";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { OnboardingModal } from "../onboarding/OnboardingModal";
import { useGeneralContext } from "../../context/General.context";
import { Routes } from "../../navigation/constants";
import { useGetUserNewNotifications } from "../../utils/api/notification";
import { useGetReleaseNotes } from "../../utils/api/panelControl/releaseNote";
import { useGetUser } from "../../utils/api/user";
import { BreakButton } from "./BreakButton";
import { LocationSelector } from "./LocationSelector";
import logo from "./logo.svg";
import NotificationModal from "./NotificationModal";
import { PageSelector } from "./PageSelector";

export interface HeaderDateProps {
  date: Date;
  setDate: (date: string) => void;
}

interface HeaderProps {
  showLocationSelector?: boolean;
  allowedLocations?: number[];
  dateProps?: HeaderDateProps;
}

export function Header({
  showLocationSelector = true,
  allowedLocations,
  dateProps,
}: HeaderProps) {
  const { t } = useTranslation();
  const notifications = useGetUserNewNotifications();
  const { isNotificationOpen, setIsNotificationOpen } = useGeneralContext();
  const user = useGetUser();
  const allReleases = useGetReleaseNotes() ?? [];
  const [isReleasesOpen, setIsReleasesOpen] = useState(false);
  const [selectedReleaseForModal, setSelectedReleaseForModal] = useState<ReleaseNote | null>(null);

  const publishedReleases = useMemo(
    () =>
      [...allReleases]
        .filter((r) => r.isPublished)
        .sort((a, b) => (b._id ?? 0) - (a._id ?? 0)),
    [allReleases]
  );
  const handleScrollToTop = () => {
    if (location.pathname === Routes.Tables) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-gray-800 shadow">
        <div className={`${dateProps ? "h-12 sm:h-16" : "h-16"} flex justify-between pl-2 lg:pl-4 pr-2 lg:pr-6 mr-2 lg:mr-20`}>
          <div className="flex flex-row gap-2 items-center">
            <Link to={Routes.Tables} onClick={handleScrollToTop}>
              <img
                src={logo}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <Link to={Routes.Tables} className="hidden sm:block">
              <span className="text-base text-white font-bold tracking-normal leading-tight">
                Da Vinci Panel
              </span>
            </Link>
          </div>
          <div className="w-auto h-full flex items-center justify-end gap-x-2 sm:gap-x-4">
            <Link to={Routes.Profile} className="flex items-center gap-2">
              <img
                src={user?.imageUrl ?? user1}
                alt="profile"
                className="w-10 h-10 rounded-full"
              />
              <span className="text-white hidden sm:inline">{user?.name}</span>
            </Link>
            {showLocationSelector && (
              <LocationSelector allowedLocations={allowedLocations} />
            )}
            <BreakButton />
            {dateProps && (
              <div className="sm:hidden">
                <DateInput date={dateProps.date} setDate={dateProps.setDate} compact />
              </div>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="relative cursor-pointer hover:scale-110 transition-transform duration-200"
            >
              <MdOutlineNotificationsNone className="text-2xl sm:text-3xl text-white" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full border-2 border-gray-800 shadow-lg ">
                  {notifications.length}
                </span>
              )}
            </div>
            {isNotificationOpen && (
              <div className="absolute top-14 sm:top-16 right-2 sm:right-4 lg:right-8 flex flex-col gap-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] w-[95%] sm:w-[450px] lg:w-[480px] p-4">
                <NotificationModal
                  onClose={() => {
                    setIsNotificationOpen(false);
                  }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReleasesOpen((prev) => !prev);
              }}
              className="relative cursor-pointer hover:scale-110 transition-transform duration-200 border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
              aria-label={t("ReleaseNotesTitleTab")}
            >
              <MdOutlineNewReleases className="text-2xl sm:text-3xl text-white" />
            </button>
            {isReleasesOpen && (
              <div className="absolute top-14 sm:top-16 right-2 sm:right-4 lg:right-8 flex flex-col gap-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] min-w-[280px] max-w-[95vw] sm:w-[320px] max-h-[60vh] overflow-y-auto p-4">
                <h3 className="text-base font-semibold text-gray-800">
                  {t("ReleaseNotesTitleTab")}
                </h3>
                {publishedReleases.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">{t("ReleaseNotesEmpty")}</p>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {publishedReleases.map((release) => (
                      <li
                        key={release._id}
                        onClick={() => {
                          setSelectedReleaseForModal(release);
                          setIsReleasesOpen(false);
                        }}
                        className="cursor-pointer py-2.5 px-3 -mx-1 rounded-lg hover:bg-indigo-50 border-l-2 border-transparent hover:border-indigo-300 transition-colors flex items-center gap-2"
                      >
                        <span className="text-sm font-semibold text-indigo-600 shrink-0">
                          {release.releaseId}
                        </span>
                        <span className="text-gray-400 text-xs select-none" aria-hidden>
                          –
                        </span>
                        <span className="text-sm text-gray-600 truncate">{release.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="lg:hidden">
              <PageSelector />
            </div>
          </div>
        </div>
      </nav>
      {selectedReleaseForModal && (
        <OnboardingModal
          releases={[selectedReleaseForModal]}
          onClose={() => setSelectedReleaseForModal(null)}
        />
      )}
    </div>
  );
}
