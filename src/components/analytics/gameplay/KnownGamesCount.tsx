import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
} from "../../../types";
import { useGetAllUsers } from "../../../utils/api/user";
import { useGetDisabledConditions } from "../../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../../utils/getItem";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";

type KnownGamesCountUser = {
  mentor: string;
  gameCount: number;
};

const KnownGamesCount = () => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const knownGamesCountDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ANALYTICS_KNOWNGAMESCOUNT,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const processedUsers = showInactiveUsers
      ? users
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }))
      : users
          .filter((user) => user.active)
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }));
    return processedUsers;
  }, [users, showInactiveUsers]);

  const columns = useMemo(
    () => [
      { key: t("Mentor"), isSortable: true },
      { key: t("Game Count"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "mentor", className: "min-w-32 pr-1" },
      { key: "gameCount", className: "min-w-32 " },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Inactive Users"),
        isUpperSide: false,
        node: (
          <SwitchButton
            checked={showInactiveUsers}
            onChange={setShowInactiveUsers}
          />
        ),
        isDisabled: knownGamesCountDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_INACTIVE_ELEMENTS &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [t, showInactiveUsers, knownGamesCountDisabledCondition, user]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          isActionsActive={false}
          rows={rows}
          filters={filters}
          title={t("Known Games Count")}
        />
      </div>
    </>
  );
};

export default KnownGamesCount;
