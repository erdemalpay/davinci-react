import { Dialog, Transition } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiCheckCircle } from "react-icons/hi2";
import { MdOutlineNewReleases } from "react-icons/md";
import { ReleaseNote } from "../../types";
import { useGetUser } from "../../utils/api/user";
import { markReleaseSeen } from "../../utils/onboardingStorage";
import { GenericButton } from "../common/GenericButton";

type OnboardingModalProps = {
  releases: ReleaseNote[];
  onClose: () => void;
};

export function OnboardingModal({ releases, onClose }: OnboardingModalProps) {
  const { t } = useTranslation();
  const user = useGetUser();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (releases.length === 0) return null;

  const release = releases[currentIndex];
  const isLast = currentIndex === releases.length - 1;
  const total = releases.length;
  const items = release.items ?? [];

  const handleNext = () => {
    if (!user?._id) return;
    markReleaseSeen(user._id, release.releaseId);

    if (isLast) {
      onClose();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <Transition
      show
      appear
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Dialog
        static
        open
        onClose={Function.prototype as () => void}
        className="relative z-[99999]"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="flex w-full max-h-[90vh] max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200/80 dark:ring-neutral-700">
              {/* Header */}
              <div className="shrink-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-slate-700 px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    <MdOutlineNewReleases className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-semibold leading-tight text-white sm:text-xl">
                      {release.title}
                    </Dialog.Title>
                    <div className="mt-1 flex items-center gap-2">
                      {release.date && (
                        <p className="text-sm text-white/85">{release.date}</p>
                      )}
                      {total > 1 && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                          {currentIndex + 1} / {total}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="px-5 py-5 sm:px-8 sm:py-6">
                  <p className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t("ReleaseNotesWhatsNew")}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      {t("ReleaseNotesNoItems")}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((item, index) => (
                        <li
                          key={index}
                          className="flex gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50 sm:gap-4 sm:p-4"
                        >
                          <span className="mt-0.5 shrink-0 text-indigo-500">
                            <HiCheckCircle className="h-5 w-5 sm:h-5 sm:w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-neutral-200 bg-neutral-50/80 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800/50 sm:px-8 sm:py-5">
                  {total > 1 && (
                    <div className="mb-3 flex justify-center gap-1.5">
                      {releases.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === currentIndex
                              ? "w-6 bg-indigo-500"
                              : i < currentIndex
                                ? "w-1.5 bg-indigo-300"
                                : "w-1.5 bg-neutral-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <GenericButton
                    onClick={handleNext}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/30"
                  >
                    {isLast ? t("ReleaseNotesGotIt") : t("ReleaseNotesNext")}
                  </GenericButton>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
