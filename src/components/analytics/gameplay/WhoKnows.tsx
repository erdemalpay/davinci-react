import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  OptionType,
} from "../../../types";
import { useGetGamesMinimal } from "../../../utils/api/game";
import { useGetDisabledConditions } from "../../../utils/api/panelControl/disabledCondition";
import { useGetAllUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import { isActionDisabled } from "../../../utils/permissions";
import SelectInput from "../../panelComponents/FormElements/SelectInput";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";


const WhoKnows = () => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const games = useGetGamesMinimal();
  const [search, setSearch] = useState(0);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const gameOptions = useMemo(
    () => games.map((game) => ({ value: game._id, label: game.name })),
    [games]
  );

  const whoKnowsDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.GAMES_WHOKNOWS,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const usersActive = showInactiveUsers
      ? users
      : users.filter((user) => user.active);
    const processedUsers = search
      ? usersActive
          .filter(
            (user) => user.userGames.filter((g) => g.game === search).length > 0
          )
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }))
      : usersActive
          .filter((user) => user.userGames.length > 0)
          .sort((a, b) => b.userGames.length - a.userGames.length)
          .map((user) => ({
            mentor: user.name,
            gameCount: user.userGames.length,
          }));

    return processedUsers;
  }, [users, search, showInactiveUsers]);

  const columns = useMemo(() => [{ key: t("Mentor"), isSortable: true }], [t]);

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
        isDisabled: isActionDisabled(
          whoKnowsDisabledCondition,
          ActionEnum.SHOW_INACTIVE_ELEMENTS,
          user
        ),
      },
    ],
    [t, showInactiveUsers, whoKnowsDisabledCondition, user]
  );

  const rowKeys = useMemo(
    () => [{ key: "mentor", className: "min-w-32 pr-1" }],
    []
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <div className="w-80 ">
          <SelectInput
            label={t("Game")}
            options={gameOptions}
            value={
              gameOptions.find((option) => option.value === search) ?? null
            }
            onChange={(selectedOption) =>
              setSearch((selectedOption as OptionType | null)?.value ?? 0)
            }
            onClear={() => setSearch(0)}
            isAutoFill={false}
            menuPortalTarget={document.body}
            menuZIndex={9999}
          />
        </div>
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          isActionsActive={false}
          title={t("Who Knows?")}
          isSearch={false}
          showOrientationToggle={false}
        />
      </div>
    </>
  );
};

export default WhoKnows;
