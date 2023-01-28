import { Role, User } from "../../types";
import { get } from "../api";
import { useGet, useMutationApi, Paths } from "./factory";

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

export function useGetUsers() {
  return useGet<User[]>(Paths.Users);
}

export function useGetUser() {
  return useGet<User>(Paths.User, [Paths.Users, "me"]);
}

export function useGetAllUsers() {
  return useGet<User[]>(Paths.AllUsers, [Paths.Users, "all"]);
}

export function useGetAllUserRoles() {
  return useGet<Role[]>(`${Paths.Users}/roles`, [Paths.Users, "roles"]);
}
