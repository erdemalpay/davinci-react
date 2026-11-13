import { describe, expect, it } from "vitest";
import {
  PairingMode,
  Tiebreaker,
  TournamentFormat,
} from "../../types/tournament";
import { autoRules, toPayload } from "./useTournamentForm";

const catanForm = {
  format: TournamentFormat.LEAGUE_THEN_ELIMINATION,
  tableSize: 4,
  leagueRounds: 4,
  advanceCount: 16,
  customizeRules: false,
  tiebreaker: Tiebreaker.SCORE,
  scoreCap: "10",
};

describe("oyun skoruyla eşitlik bozma (Catan)", () => {
  it("otomatik kurallar galibiyet puanı, rastgele eşleşme ve tek çıkan olur", () => {
    expect(autoRules(4, Tiebreaker.SCORE)).toEqual({
      pairingMode: PairingMode.RANDOM,
      placementPoints: [1, 0, 0, 0],
      byePoints: 1,
      minTableSize: 3,
      advancePerTable: 1,
    });
  });

  it("formdan eşitlik bozucuyu, skor sınırını ve Catan puanlarını gönderir", () => {
    expect(toPayload(catanForm)).toMatchObject({
      tiebreaker: Tiebreaker.SCORE,
      scoreCap: 10,
      placementPoints: [1, 0, 0, 0],
      placementPointsBySize: { 3: [1, 0, 0] },
      pairingMode: PairingMode.RANDOM,
      advancePerTable: 1,
    });
  });

  it("rakip ortalamasına dönülünce düzenlemede skor sınırını temizler", () => {
    const payload = toPayload(
      { ...catanForm, tiebreaker: Tiebreaker.OPPONENTS },
      null
    );
    expect(payload).toMatchObject({
      tiebreaker: Tiebreaker.OPPONENTS,
      scoreCap: null,
      placementPoints: [4, 2, 1, 0],
    });
  });
});

describe("Catan eşleşme planı", () => {
  it("özelleştirilen eşleşme modunu ve 3 tur ayarını gönderir", () => {
    expect(
      toPayload({
        ...catanForm,
        leagueRounds: 3,
        customizeRules: true,
        pairingMode: PairingMode.CATAN_PLAN,
      })
    ).toMatchObject({
      pairingMode: PairingMode.CATAN_PLAN,
      tableSize: 4,
      leagueRounds: 3,
      minTableSize: 3,
      placementPoints: [1, 0, 0, 0],
    });
  });

  it("özelleştirilmediyse otomatik rastgele eşleşme kalır", () => {
    expect(
      toPayload({ ...catanForm, pairingMode: PairingMode.CATAN_PLAN })
    ).toMatchObject({ pairingMode: PairingMode.RANDOM });
  });
});
