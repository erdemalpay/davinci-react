import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Role, User } from "../../types";
import { get, patch, post } from "../api";
import { UserGameUpdateType } from "./../../types/index";
import { Paths, useGet, useGetList, useMutationApi } from "./factory";
export function getUserWithToken(): Promise<User> {
  return get<User>({ path: "/users/me" });
}

export function useUserMutations() {
  const { updateItem: updateUser, createItem: createUser } =
    useMutationApi<User>({
      baseQuery: Paths.Users,
    });

  return { updateUser, createUser };
}

function updateUserPasswordRequest({
  oldPassword,
  newPassword,
}: {
  oldPassword: string;
  newPassword: string;
}) {
  return post({
    path: `${Paths.Users}/password`,
    payload: { oldPassword, newPassword },
  });
}

export function useUpdatePasswordMutation() {
  const { t } = useTranslation();
  const { mutate: updatePassword } = useMutation(updateUserPasswordRequest, {
    onError: (_err: any, _newTable) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(t(errorMessage)), 200);
    },
  });

  return { updatePassword };
}
function resetUserPasswordRequest({ id }: { id: string }) {
  return post({
    path: `${Paths.Users}/resetPassword`,
    payload: { id },
  });
}

export function useResetPasswordMutation() {
  const { mutate: resetPassword } = useMutation(resetUserPasswordRequest);
  return { resetPassword };
}
function updateUserGames({
  gameId,
  updateType,
  learnDate,
}: {
  gameId: number;
  updateType: UserGameUpdateType;
  learnDate: string;
}) {
  return patch({
    path: `${Paths.Users}/games`,
    payload: { learnDate, gameId, updateType },
  });
}
export function updateUserGamesMutation() {
  const queryClient = useQueryClient();

  const { mutate: updateUserGame } = useMutation(updateUserGames, {
    onSuccess: () => {
      queryClient.invalidateQueries([Paths.Users]);
    },
  });

  return { updateUserGame };
}

export function useGetUsers() {
  return useGetList<User>(Paths.Users);
}

export function useGetUser() {
  return useGet<User>(Paths.User, [Paths.Users, "me"]);
}
export function useGetUserWithId(id: string) {
  return useGet<User>(`${Paths.Users}/${id}`, [Paths.Users, id]);
}

export function useGetAllUsers() {
  return useGetList<User>(Paths.AllUsers, [Paths.Users, "all"]);
}

export function useGetAllUserRoles() {
  return useGetList<Role>(`${Paths.Users}/roles`, [Paths.Users, "roles"]);
}
