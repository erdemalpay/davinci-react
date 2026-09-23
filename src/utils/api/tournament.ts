import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { patch, post, remove } from ".";
import {
  ConfirmationStatus,
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

  const options = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [baseUrl] }),
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

  const submitScores = useMutation({
    mutationFn: ({
      matchId,
      scores,
    }: {
      matchId: number;
      scores: { participantId: number; score: number }[];
    }) =>
      patch({
        path: `${baseUrl}/matches/${matchId}/scores`,
        payload: { scores },
      }),
    ...options,
  });

  return {
    updateConfirmation: updateConfirmation.mutate,
    promoteRegistrations: promoteRegistrations.mutate,
    addParticipant: addParticipant.mutate,
    removeParticipant: removeParticipant.mutate,
    generateNextRound: generateNextRound.mutate,
    isGeneratingRound: generateNextRound.isPending,
    submitScores: submitScores.mutate,
  };
}
