import { useQuery } from "@tanstack/react-query";
import { post, get } from ".";
import { axiosClient } from "./axiosClient";
import {
  SurveyEvent,
  SurveyQuestion,
  SurveyResponse,
  RewardCode,
  SubmitSurveyPayload,
  SubmitSurveyResult,
  ValidateCodeResult,
  RedeemCodePayload,
  AnalyticsSummary,
  PaginatedResult,
} from "../../types/event-survey";
import { Paths, useMutationApi, useGetList } from "./factory";

export interface MarketingConsentStats {
  yes: number;
  no: number;
}

export const EventSurveyPaths = {
  events: `${Paths.EventSurvey}/events`,
  publicEvent: (slug: string) => `${Paths.EventSurvey}/public/event/${slug}`,
  publicSubmit: `${Paths.EventSurvey}/public/submit`,
  questions: (eventId: number) =>
    `${Paths.EventSurvey}/events/${eventId}/questions`,
  responses: `${Paths.EventSurvey}/responses`,
  validate: `${Paths.EventSurvey}/validate`,
  redeem: `${Paths.EventSurvey}/redeem`,
  analyticsSummary: `${Paths.EventSurvey}/analytics/summary`,
  questionAnswers: `${Paths.EventSurvey}/analytics/question-answers`,
  marketingConsent: `${Paths.EventSurvey}/analytics/marketing-consent`,
};

// ─── Event (Etkinlik) ──────────────────────────────────────────────────────

export function useGetEvents() {
  return useGetList<SurveyEvent>(EventSurveyPaths.events);
}

export function useEventMutations() {
  const { createItem, updateItem, deleteItem } = useMutationApi<SurveyEvent>({
    baseQuery: EventSurveyPaths.events,
  });
  return {
    createEvent: createItem,
    updateEvent: updateItem,
    deleteEvent: deleteItem,
  };
}

export async function updateEventStatus(
  id: number,
  status: string
): Promise<SurveyEvent> {
  const { data } = await axiosClient.patch(
    `${EventSurveyPaths.events}/${id}/status`,
    { status }
  );
  return data;
}

// ─── Sorular ──────────────────────────────────────────────────────────────

export function useGetQuestions(eventId: number | undefined) {
  const path = eventId ? EventSurveyPaths.questions(eventId) : "";
  return useGetList<SurveyQuestion>(path, [path], true, {
    enabled: !!eventId,
  });
}

export function useQuestionMutations(eventId: number) {
  const { createItem, updateItem, deleteItem } =
    useMutationApi<SurveyQuestion>({
      baseQuery: EventSurveyPaths.questions(eventId),
    });
  return {
    createQuestion: createItem,
    updateQuestion: updateItem,
    deleteQuestion: deleteItem,
  };
}

// ─── Public form (JWT gerektirmez) ────────────────────────────────────────

export function useGetPublicEvent(slug: string | undefined) {
  const path = slug ? EventSurveyPaths.publicEvent(slug) : "";
  return useQuery<{ event: SurveyEvent; questions: SurveyQuestion[]; available: boolean }>({
    queryKey: [path],
    queryFn: () => get({ path }),
    enabled: !!slug,
    staleTime: 0,
  });
}

export async function submitSurvey(
  payload: SubmitSurveyPayload
): Promise<SubmitSurveyResult> {
  return post({ path: EventSurveyPaths.publicSubmit, payload });
}

// ─── Operasyon (Barista/GM) ───────────────────────────────────────────────

export async function validateCode(code: string): Promise<ValidateCodeResult> {
  return post({ path: EventSurveyPaths.validate, payload: { code } });
}

export async function redeemCode(
  payload: RedeemCodePayload
): Promise<ValidateCodeResult> {
  return post({ path: EventSurveyPaths.redeem, payload });
}

// ─── Analytics ────────────────────────────────────────────────────────────

export function useGetResponses(params: {
  eventId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const query = new URLSearchParams();
  if (params.eventId) query.set("eventId", String(params.eventId));
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const url = `${EventSurveyPaths.responses}?${query.toString()}`;
  return useQuery<PaginatedResult<SurveyResponse>>({
    queryKey: [url],
    queryFn: () => get({ path: url }),
    staleTime: 0,
    enabled: !!params.eventId,
  });
}

export interface QuestionAnswer {
  email: string;
  answer: string;
  createdAt: string;
}

export function useGetMarketingConsentStats(eventId?: number) {
  const url = `${EventSurveyPaths.marketingConsent}?eventId=${eventId}`;
  return useQuery<MarketingConsentStats>({
    queryKey: [url],
    queryFn: () => get({ path: url }),
    staleTime: 0,
    enabled: !!eventId,
  });
}

export function useGetQuestionAnswers(eventId?: number, questionId?: number) {
  const url = `${EventSurveyPaths.questionAnswers}?eventId=${eventId}&questionId=${questionId}`;
  return useQuery<QuestionAnswer[]>({
    queryKey: [url],
    queryFn: () => get({ path: url }),
    staleTime: 0,
    enabled: !!eventId && !!questionId,
  });
}

export function useGetAnalyticsSummary(eventId?: number) {
  const url = eventId
    ? `${EventSurveyPaths.analyticsSummary}?eventId=${eventId}`
    : EventSurveyPaths.analyticsSummary;
  return useQuery<AnalyticsSummary>({
    queryKey: [url],
    queryFn: () => get({ path: url }),
    staleTime: 0,
    enabled: !!eventId,
  });
}
