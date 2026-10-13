import { StaffDailyCounts } from "../staffPerformance";
import { Paths, useGetList } from "./factory";

export function useGetStaffDailyCounts(
  after: string,
  before: string,
  location?: number
) {
  let url = `${Paths.StaffPerformance}/daily-counts?after=${after}&before=${before}`;
  if (location) {
    url = url.concat(`&location=${location}`);
  }
  return useGetList<StaffDailyCounts>(
    url,
    [Paths.StaffPerformance, after, before, location],
    true
  );
}
