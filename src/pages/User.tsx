import { FormEvent } from "react";
import { EditableText } from "../components/common/EditableText";
import { Header } from "../components/header/Header";
import GameMaster from "../components/user/GameMaster";
import { useUserContext } from "../context/User.context";
import { User } from "../types";
import { useUserMutations } from "../utils/api/user";

export default function UserView() {
  const { user } = useUserContext();

  const { updateUser } = useUserMutations();

  function updateUserHandler(event: FormEvent<HTMLInputElement>, item?: User) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateUser({
      id: item._id,
      updates: { [target.name]: target.value },
    });
  }

  if (!user) return <></>;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4 mx-0 lg:mx-20">
        <div className="bg-white shadow w-full px-6 py-5 mt-4">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex flex-col justify-between mb-4">
              <div className="text-base lg:text-2xl font-bold leading-normal text-gray-800 flex gap-4">
                <EditableText
                  name="name"
                  text={user.name}
                  onUpdate={updateUserHandler}
                  item={user}
                  placeholder="Display Name"
                />
                <div className="flex gap-1">
                  {"("}
                  <EditableText
                    name="role"
                    text={user.role.name}
                    onUpdate={updateUserHandler}
                    item={user}
                    placeholder="Role"
                  />
                  {")"}
                </div>
              </div>
              <div className="text-base lg:text-md font-bold leading-normal text-gray-800 flex">
                {"Full Name: "}
                <EditableText
                  name="fullName"
                  text={user.fullName}
                  onUpdate={updateUserHandler}
                  item={user}
                  placeholder="Full Name"
                />
              </div>
              <p className="text-base lg:text-md font-bold leading-normal text-gray-800">
                <EditableText
                  name="phone"
                  text={user.phone}
                  onUpdate={updateUserHandler}
                  placeholder="Phone Number"
                  item={user}
                  type="phone"
                />
                {user.workType}
              </p>
            </div>
          </div>
        </div>
        {/* game master gameplay list */}
        {user.role._id === 2 && <GameMaster user={user} />}
      </div>
    </>
  );
}
