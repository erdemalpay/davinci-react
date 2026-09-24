export enum TournamentStatus {
  NOT_STARTED = "not_started",
  ONGOING = "ongoing",
  FINISHED = "finished",
}

export enum TournamentFormat {
  LEAGUE = "league", // tek aşama: sadece Swiss/lig
  ELIMINATION = "elimination", // tek aşama: masadan kazananlar üst tura
  LEAGUE_THEN_ELIMINATION = "league_then_elimination", // iki aşama
}

export enum PairingMode {
  SWISS = "swiss",
  RANDOM = "random",
}

export enum MatchStage {
  LEAGUE = "league",
  ELIMINATION = "elimination",
}

export enum RegistrationSource {
  QR = "qr",
  SOCIAL = "social",
  OTHER = "other",
}

export enum ConfirmationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  UNREACHABLE = "unreachable",
}

export interface Tournament {
  _id: number;
  name: string;
  game?: number;
  location?: number;
  date: string;
  slug: string;
  status: TournamentStatus;
  isRegistrationOpen: boolean;
  registrationDeadline?: string;
  format: TournamentFormat;
  pairingMode: PairingMode;
  tableSize: number;
  eliminationTableSize?: number; // boşsa tableSize
  // Formata bağlı ayarlar: kullanılmayanlar boş olabilir
  minTableSize?: number;
  leagueRounds: number;
  placementPoints: number[];
  byePoints?: number;
  advanceCount?: number;
  advancePerTable?: number;
}

export interface TournamentRegistration {
  _id: number;
  tournamentId: number;
  fullName: string;
  phone: string;
  email?: string;
  source: RegistrationSource;
  confirmationStatus: ConfirmationStatus;
  confirmedAt?: string;
  createdAt: string;
}

export interface TournamentParticipant {
  _id: number;
  tournamentId: number;
  name: string;
  registrationId?: number;
  isActive: boolean;
}

export interface TournamentMatchPlayer {
  participantId: number;
  score?: number;
  rank?: number;
  points?: number;
  wonTieBreak?: boolean; // eşit skorda organizatörün öne aldığı oyuncu
}

export interface TournamentMatch {
  _id: number;
  tournamentId: number;
  stage: MatchStage;
  round: number;
  tableNo: number;
  isBye: boolean;
  isCompleted: boolean;
  players: TournamentMatchPlayer[];
  // Eleme masasında çıkış sınırında eşitlik: organizatör `slots` kişi seçene kadar dolu
  pendingTie?: { participantIds: number[]; slots: number } | null;
}

export interface TournamentStanding {
  participantId: number;
  name?: string;
  rank: number;
  points: number;
  matchesPlayed: number;
  byeCount: number;
  avgOpponentPoints: number;
  // Puan turlarında tur tur alınan puan (bay geçtiyse isBye)
  rounds?: { round: number; points: number; isBye: boolean }[];
  // Elemeye çıktıysa ulaştığı son tur ve o masadaki sırası
  elimination?: { round: number; isFinal: boolean; tableRank?: number };
}

export interface PublicTournament {
  _id: number;
  name: string;
  date: string;
  isRegistrationOpen: boolean;
}
