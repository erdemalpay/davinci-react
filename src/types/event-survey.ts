export enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum QuestionType {
  SINGLE_CHOICE = "single_choice",
  MULTI_CHOICE = "multi_choice",
  TEXT = "text",
  CONSENT = "consent",
}

export enum RewardCodeStatus {
  ISSUED = "issued",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
}

export enum RedeemChannel {
  BARISTA = "barista",
  GM = "gm",
}

export interface SurveyEvent {
  _id: number;
  name: string;
  slug: string;
  status: EventStatus;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
  location?: string;
  stand?: string;
  rewardLabel: string;
  codeValidityDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  _id: number;
  eventId: number;
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  order: number;
  isActive: boolean;
}

export interface SurveyAnswer {
  questionId: number;
  questionLabel: string;
  answer: string | string[];
}

export interface SurveyResponse {
  _id: number;
  eventId: number;
  fullName: string;
  email: string;
  emailMarketingConsent: boolean;
  answers: SurveyAnswer[];
  createdAt: string;
  isRedeemed?: boolean;
  redeemChannel?: RedeemChannel | null;
}

export interface RewardCode {
  _id: number;
  code: string;
  responseId: number;
  eventId: number;
  expiresAt: string;
  status: RewardCodeStatus;
  redeemedAt?: string;
  redeemedByUserId?: string;
  redeemChannel?: RedeemChannel;
  rewardLabel: string;
}

export interface SubmitSurveyPayload {
  eventId: number;
  fullName: string;
  email: string;
  emailMarketingConsent: boolean;
  answers?: SurveyAnswer[];
}

export interface SubmitSurveyResult {
  code: string;
  expiresAt: string;
  rewardLabel: string;
  eventName: string;
  codeValidityDays: number;
}

export interface ValidateCodeResult {
  code: string;
  status: RewardCodeStatus;
  rewardLabel: string;
  expiresAt: string;
  redeemedAt?: string;
  redeemChannel?: RedeemChannel;
  eventName?: string;
  eventStartAt?: string;
  eventEndAt?: string;
  fullName?: string;
  redeemedByUserName?: string;
  createdAt: string;
}

export interface RedeemCodePayload {
  code: string;
  channel: RedeemChannel;
}

export interface DailyTrendItem {
  _id: string;
  count: number;
}

export interface AnalyticsSummary {
  totalResponses: number;
  totalIssued: number;
  totalRedeemed: number;
  redeemRate: number;
  dailyTrend: DailyTrendItem[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
