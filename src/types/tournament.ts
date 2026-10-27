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

// Puanı eşit oyuncuların sırası: rakiplerin ortalama puanı ya da oyunda alınan skor
// (Catan resmi kuralı: toplam skor → masadaki pay → 2.lik, 3.lük sayısı)
export enum Tiebreaker {
  OPPONENTS = "opponents",
  SCORE = "score",
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
  startTime?: string;
  slug: string;
  status: TournamentStatus;
  isRegistrationOpen: boolean;
  registrationDeadline?: string;
  format: TournamentFormat;
  pairingMode: PairingMode;
  tableSize: number;
  eliminationTableSize?: number; // boşsa tableSize
  thirdPlaceMatch?: boolean; // final turunda yarı finalde elenenler de bir masada oynar
  // Formata bağlı ayarlar: kullanılmayanlar boş olabilir
  minTableSize?: number;
  leagueRounds: number;
  placementPoints: number[];
  placementPointsBySize?: Record<number, number[]>; // eksik kurulan masaların puanları
  byePoints?: number;
  advanceCount?: number;
  advancePerTable?: number;
  roundDuration?: number; // tur süresi (dk); boşsa süre sınırı yok
  tiebreaker?: Tiebreaker; // boşsa rakiplerin ortalama puanı
  scoreCap?: number; // oyun skoruyla eşitlik bozmada oyun başına sayılan en fazla skor
  // O anki tura verilen ek süre (dk) ve sayacın elle bitirilmesi; her yeni turda sıfırlanır
  roundExtraMinutes?: number;
  isRoundTimerStopped?: boolean;
  // Duraklatıldıysa duraklatıldığı an; önceki duraklamalarda geçen toplam süre (sn)
  roundPausedAt?: string | null;
  roundPausedSeconds?: number;
  capacity?: number; // asil kontenjanı; boşsa sınırsız, asil/yedek ayrımı yok
  waitlistCapacity?: number; // boşsa yedek sınırsız
  hasEntryFee?: boolean; // ücretliyse asil ödeme alınınca katılımcı olur
  participationNote?: string; // kayıt formunda ve mailde gösterilir
  waitlistNote?: string; // yalnızca yedeklere gösterilir
}

// Yedek listesinde kişiye bildirilen yer (backend ListStatus)
export enum ListStatus {
  MAIN = "main",
  WAITLIST = "waitlist",
  WITHDRAWN = "withdrawn",
}

// Katılmayacak bilgisinin geldiği yer
export enum DeclineSource {
  LINK = "link",
  PANEL = "panel",
}

export interface ListPosition {
  listStatus: ListStatus;
  waitlist?: number;
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
  sequence?: number; // turnuvadaki kayıt sırası; eski başvurularda yok
  isPaid?: boolean;
  arrivedAt?: string; // QR okutulup kafeye geldiği an
  declineSource?: DeclineSource | null;
  isManualMain?: boolean; // "Asil yap" denildi, liste güncellenince asil olur
  position?: ListPosition; // kişiye bildirilen yer; kontenjansız turnuvada yok
  nextPosition?: ListPosition; // "Yedek Listesini Güncelle"de alacağı yer
}

// Maildeki "Katılamayacağım" linkinin açtığı sayfa
export interface PublicRegistration {
  tournamentName: string;
  date: string;
  startTime?: string;
  fullName: string;
  registrationStatus?: string;
  isDeclined: boolean;
  canDecline: boolean;
}

// QR okutmanın sonucu; ücretli turnuvada asil ödeme alınana kadar katılımcı olmaz
export interface TournamentCheckIn {
  registrationId: number;
  fullName: string;
  listStatus?: ListStatus;
  waitlistNumber?: number;
  hasEntryFee: boolean;
  isParticipant: boolean;
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
  isThirdPlace?: boolean; // final turundaki 3.'lük masası
  players: TournamentMatchPlayer[];
  // Eleme masasında çıkış sınırında eşitlik: organizatör `slots` kişi seçene kadar dolu
  pendingTie?: { participantIds: number[]; slots: number } | null;
  createdAt?: string; // turun başladığı an (tur sayacı)
}

export interface TournamentStanding {
  participantId: number;
  name?: string;
  rank: number;
  points: number;
  matchesPlayed: number;
  byeCount: number;
  avgOpponentPoints: number;
  // Sadece oyun skoruyla eşitlik bozmada: sınırlanmış toplam skor ve masadaki payların toplamı (%)
  totalScore?: number;
  scoreShare?: number;
  // Puan turlarında tur tur alınan puan (bay geçtiyse isBye)
  rounds?: { round: number; points: number; score?: number; isBye: boolean }[];
  // Elemeye çıktıysa ulaştığı son tur ve o masadaki sırası
  elimination?: {
    round: number;
    isFinal: boolean;
    isThirdPlace?: boolean;
    tableRank?: number;
  };
}

export interface PublicTournament {
  _id: number;
  name: string;
  date: string;
  startTime?: string;
  isRegistrationOpen: boolean;
  participationNote?: string;
}

// Oyuncuların telefondan takip ettiği sayfanın verisi; katılımcıların sadece adı gelir
export interface TournamentLive {
  tournament: Tournament;
  participants: Pick<TournamentParticipant, "_id" | "name" | "isActive">[];
  matches: TournamentMatch[];
  standings: TournamentStanding[];
}
