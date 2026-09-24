import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { get, patch, post, remove } from ".";
import {
  ConfirmationStatus,
  PublicTournament,
  RegistrationSource,
  Tournament,
  TournamentMatch,
  TournamentParticipant,
  TournamentRegistration,
  TournamentStanding,
} from "../../types/tournament";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = Paths.Tournaments;

// Alt kaynakların anahtarı [baseUrl, ...] ile başlar; tournamentChanged hepsini tazeler.
const tournamentKey = (id: number, resource: string) => [baseUrl, id, resource];

export function useGetTournaments() {
  return useGetList<Tournament>(baseUrl);
}

export function useTournamentMutations() {
  const { createItem, updateItem, deleteItem } = useMutationApi<Tournament>({
    baseQuery: baseUrl,
  });
  return {
    createTournament: createItem,
    updateTournament: updateItem,
    deleteTournament: deleteItem,
  };
}

const useTournamentResource = <T>(id: number, resource: string) =>
  useGetList<T>(
    `${baseUrl}/${id}/${resource}`,
    tournamentKey(id, resource),
    true
  );

export const useGetTournamentRegistrations = (id: number) =>
  useTournamentResource<TournamentRegistration>(id, "registrations");

export const useGetTournamentParticipants = (id: number) =>
  useTournamentResource<TournamentParticipant>(id, "participants");

export const useGetTournamentMatches = (id: number) =>
  useTournamentResource<TournamentMatch>(id, "matches");

export const useGetTournamentStandings = (id: number) =>
  useTournamentResource<TournamentStanding>(id, "standings");

export function useTournamentActions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Diğer sorguları backend'in tournamentChanged websocket olayı tazeler
  const options = {
    onError: (error: unknown) => {
      setTimeout(
        () =>
          toast.error(
            t(getApiErrorMessage(error, "An unexpected error occurred"))
          ),
        200
      );
    },
  };

  const updateConfirmation = useMutation({
    mutationFn: ({
      registrationId,
      confirmationStatus,
    }: {
      registrationId: number;
      confirmationStatus: ConfirmationStatus;
    }) =>
      patch({
        path: `${baseUrl}/registrations/${registrationId}`,
        payload: { confirmationStatus },
      }),
    ...options,
  });

  const promoteRegistrations = useMutation({
    mutationFn: ({
      tournamentId,
      registrationIds,
    }: {
      tournamentId: number;
      registrationIds: number[];
    }) =>
      post({
        path: `${baseUrl}/${tournamentId}/registrations/promote`,
        payload: { registrationIds },
      }),
    ...options,
  });

  const addParticipant = useMutation({
    mutationFn: ({
      tournamentId,
      name,
    }: {
      tournamentId: number;
      name: string;
    }) =>
      post({
        path: `${baseUrl}/${tournamentId}/participants`,
        payload: { name },
      }),
    ...options,
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: number) =>
      remove({ path: `${baseUrl}/participants/${participantId}` }),
    ...options,
  });

  const generateNextRound = useMutation({
    mutationFn: (tournamentId: number) =>
      post({ path: `${baseUrl}/${tournamentId}/rounds`, payload: {} }),
    ...options,
  });

  // Sunucunun döndürdüğü maçı listeye hemen yazar; skor ve beraberlik seçimi
  // tüm tur listesinin yeniden yüklenmesini beklemeden görünür.
  const matchOptions = {
    ...options,
    onSuccess: (match: TournamentMatch) => {
      queryClient.setQueryData<TournamentMatch[]>(
        tournamentKey(match.tournamentId, "matches"),
        (matches) => matches?.map((m) => (m._id === match._id ? match : m))
      );
    },
  };

  const submitScores = useMutation({
    mutationFn: ({
      matchId,
      scores,
    }: {
      matchId: number;
      scores: { participantId: number; score: number }[];
    }) =>
      patch<unknown, TournamentMatch>({
        path: `${baseUrl}/matches/${matchId}/scores`,
        payload: { scores },
      }),
    ...matchOptions,
  });

  const resolveTie = useMutation({
    mutationFn: ({
      matchId,
      winnerIds,
    }: {
      matchId: number;
      winnerIds: number[];
    }) =>
      patch<unknown, TournamentMatch>({
        path: `${baseUrl}/matches/${matchId}/tiebreak`,
        payload: { winnerIds },
      }),
    ...matchOptions,
  });

  return {
    updateConfirmation: updateConfirmation.mutate,
    promoteRegistrations: promoteRegistrations.mutate,
    addParticipant: addParticipant.mutate,
    removeParticipant: removeParticipant.mutate,
    generateNextRound: generateNextRound.mutate,
    isGeneratingRound: generateNextRound.isPending,
    submitScores: submitScores.mutate,
    resolveTie: resolveTie.mutate,
  };
}

// ─── Public kayıt sayfası (JWT gerektirmez) ──────────────────────────────

export function useGetPublicTournament(slug: string | undefined) {
  const path = slug ? `${baseUrl}/public/${slug}` : "";
  return useQuery<PublicTournament>({
    queryKey: [path],
    queryFn: () => get({ path }),
    enabled: !!slug,
    staleTime: 0,
  });
}

export function registerTournament(
  slug: string,
  payload: {
    fullName: string;
    phone: string;
    email: string;
    source?: RegistrationSource;
  }
) {
  return post({ path: `${baseUrl}/public/${slug}/register`, payload });
}
