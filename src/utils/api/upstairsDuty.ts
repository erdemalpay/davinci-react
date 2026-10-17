import { UpstairsDuty } from "../../types";
import { Paths, useGet } from "./factory";

// The day's upstairs duties at a location, oldest first.
export const useGetUpstairsDuties = (location: number, date: string) =>
  useGet<UpstairsDuty[]>(
    `${Paths.UpstairsDuty}?date=${date}&location=${location}`,
    [Paths.UpstairsDuty, location, date],
    true,
    { enabled: !!location }
  );
