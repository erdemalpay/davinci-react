import { useMutation } from "@tanstack/react-query";
import { Role, User } from "../../types";
import { get, post } from "../api";
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
  const { mutate: updatePassword } = useMutation(updateUserPasswordRequest);

  return { updatePassword };
}

export function useGetUsers() {
  return useGetList<User>(Paths.Users);
}

export function useGetUser() {
  return useGet<User>(Paths.User, [Paths.Users, "me"]);
}

export function useGetAllUsers() {
  return useGetList<User>(Paths.AllUsers, [Paths.Users, "all"]);
}

export function useGetAllUserRoles() {
  return useGetList<Role>(`${Paths.Users}/roles`, [Paths.Users, "roles"]);
}
