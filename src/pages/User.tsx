import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegListAlt, FaRegUserCircle } from "react-icons/fa";
import { MdOutlineEventNote } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import GameMasterSummary from "../components/user/GameMasterSummary";
import GamesIKnow from "../components/user/GamesIKnow";
import GamesIMentored from "../components/user/GamesIMentored";
import { useGeneralContext } from "../context/General.context";
import { RoleEnum, User } from "../types";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetUsers, useGetUserWithId } from "../utils/api/user";

export default function UserView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { userId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User>();
  const user = useGetUserWithId(userId as string);
  const { t } = useTranslation();
  const users = useGetUsers();
  const { data } = useGetMentorGamePlays(userId as string);
  const userOptions = users
    ?.filter((user) => user.active === true)
    ?.map((user) => {
      return {
        value: user._id,
        label: user.name,
      };
    });
  const tabs = [
    {
      number: 0,
      label: "Personal Details",
      icon: <FaRegUserCircle className="text-lg font-thin" />,
      content: user && <PersonalDetails isEditable={false} user={user} />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Mentored Games",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: user && data && (
        <div className="px-4 w-full">
          <GamesIMentored data={data} />
        </div>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
    {
      number: 2,
      label: `${t("Known Games")}(${user?.userGames.length})`,
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: user && (
        <div className="px-4 w-full">
          <GamesIKnow userId={user._id} />
        </div>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
    {
      number: 3,
      label: `${t("User Summary")}`,
      icon: <FaRegListAlt className="text-lg font-thin" />,
      content: user && (
        <div className="px-4 w-full">
          <GameMasterSummary userId={user._id} />
        </div>
      ),
      isDisabled: !(user?.role._id === RoleEnum.GAMEMASTER),
    },
  ];
  if (!user) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={userOptions}
              value={
                selectedUser
                  ? {
                      value: selectedUser._id,
                      label: selectedUser.name,
                    }
                  : {
                      value: user._id,
                      label: user.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedUser(
                  users?.find((user) => user._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/user/${selectedOption?.value}`);
              }}
              placeholder={t("Select a user")}
            />
          </div>
        </div>

        {user && (
          <TabPanel
            key={tabPanelKey}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            additionalOpenAction={() => {
              setCurrentPage(1);
              setSearchQuery("");
            }}
          />
        )}
      </div>
    </>
  );
}
