import { useState } from "react";
import { useGetReleaseNotes } from "../../utils/api/panelControl/releaseNote";
import { useGetUser } from "../../utils/api/user";
import { getSeenReleaseIds } from "../../utils/onboardingStorage";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingModalWrapper() {
  const user = useGetUser();
  const allReleases = useGetReleaseNotes();
  const [dismissed, setDismissed] = useState(false);

  if (!allReleases || !user?._id) return null;

  const seen = getSeenReleaseIds(user._id);
  const userStart = user.jobStartDate ? new Date(user.jobStartDate) : null;
  const unseenReleases = allReleases
    .filter((r) => {
      if (!r.isPublished) return false;
      if (seen.includes(r.releaseId)) return false;
      if (userStart && r.date) {
        return new Date(r.date) >= userStart;
      }
      return true;
    })
    .sort((a, b) => a._id - b._id);

  if (dismissed || unseenReleases.length === 0) return null;

  return (
    <OnboardingModal
      releases={unseenReleases}
      onClose={() => setDismissed(true)}
    />
  );
}
