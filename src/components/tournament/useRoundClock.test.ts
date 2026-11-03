import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";
import { useRoundClock } from "./useRoundClock";

const CREATED_AT = "2026-11-01T10:00:00.000Z";
const NOW = new Date("2026-11-01T10:20:00.000Z");

const match = { isCompleted: false, createdAt: CREATED_AT } as TournamentMatch;

const tournamentWith = (fields: Partial<Tournament>) =>
  ({
    status: TournamentStatus.ONGOING,
    roundDuration: 60,
    ...fields,
  } as Tournament);

const MINUTE = 60 * 1000;

describe("useRoundClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("süre başlatılmadıysa tam süreyi gösterir ve akmaz", () => {
    const { result } = renderHook(() =>
      useRoundClock(tournamentWith({ roundStartedAt: null }), [match])
    );
    expect(result.current.isActive).toBe(true);
    expect(result.current.isWaiting).toBe(true);
    expect(result.current.remaining).toBe(60 * MINUTE);
  });

  it("elle başlatılan süre başlatıldığı andan sayılır", () => {
    const startedAt = new Date(NOW.getTime() - 5 * MINUTE).toISOString();
    const { result } = renderHook(() =>
      useRoundClock(tournamentWith({ roundStartedAt: startedAt }), [match])
    );
    expect(result.current.isWaiting).toBe(false);
    expect(result.current.remaining).toBe(55 * MINUTE);
  });

  it("alanı olmayan eski turda süre maçların oluştuğu andan sayılır", () => {
    const { result } = renderHook(() =>
      useRoundClock(tournamentWith({}), [match])
    );
    expect(result.current.isWaiting).toBe(false);
    expect(result.current.remaining).toBe(40 * MINUTE);
  });

  it("süre bitirilmişse bekleyen turda da sayaç görünmez", () => {
    const { result } = renderHook(() =>
      useRoundClock(
        tournamentWith({ roundStartedAt: null, isRoundTimerStopped: true }),
        [match]
      )
    );
    expect(result.current.isActive).toBe(false);
  });
});
