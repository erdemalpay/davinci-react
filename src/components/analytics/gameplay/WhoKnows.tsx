import { format, isValid } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import { ActionEnum, DisabledConditionEnum, OptionType } from "../../../types";
import { useGetGameLearningHistory } from "../../../utils/api/activity";
import { useGetGamesMinimal } from "../../../utils/api/game";
import { useGetDisabledConditions } from "../../../utils/api/panelControl/disabledCondition";
import { useGetAllUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import { isActionDisabled } from "../../../utils/permissions";
import SelectInput from "../../panelComponents/FormElements/SelectInput";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";

type HistoryRow = { date: string; event: string };

const WhoKnows = () => {
  const { t } = useTranslation();
  const users = useGetAllUsers();
  const games = useGetGamesMinimal();
  const [search, setSearch] = useState(0);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const history = useGetGameLearningHistory(search);
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const gameOptions = useMemo(
    () => games.map((game) => ({ value: game._id, label: game.name })),
    [games]
  );

  const whoKnowsDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.GAMES_WHOKNOWS, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const usersActive = showInactiveUsers
      ? users
      : users.filter((user) => user.active);
    if (!search) {
      return usersActive
        .filter((user) => user.userGames.length > 0)
        .sort((a, b) => b.userGames.length - a.userGames.length)
        .map((user) => ({
          mentor: user.name,
          gameCount: user.userGames.length,
        }));
    }
    // With a game picked, each person opens to when they added it to the
    // games they know and when they removed it.
    const records = history ?? [];
    return usersActive.flatMap((user) => {
      const known = user.userGames.find((g) => g.game === search);
      const own = records.filter((r) => r.user === user._id);
      if (!known && (!showRemoved || own.length === 0)) return [];
      const collapsibleRows: HistoryRow[] = own.map((r) => ({
        date: format(new Date(r.date), "dd.MM.yyyy HH:mm"),
        event: r.learned
          ? t("Added to the games they know")
          : t("Removed from the games they know"),
      }));
      if (known?.learnDate && isValid(new Date(known.learnDate))) {
        collapsibleRows.unshift({
          date: format(new Date(known.learnDate), "dd.MM.yyyy"),
          event: t("Learn date entered"),
        });
      }
      return [
        {
          mentor: known ? user.name : `${user.name} (${t("removed it")})`,
          gameCount: user.userGames.length,
          collapsible: {
            collapsibleColumns: [
              { key: t("Date"), isSortable: false },
              { key: t("What happened"), isSortable: false },
            ],
            collapsibleRows,
            collapsibleRowKeys: [{ key: "date" }, { key: "event" }],
          },
        },
      ];
    });
  }, [users, search, showInactiveUsers, showRemoved, history, t]);

  const columns = useMemo(() => [{ key: t("Mentor"), isSortable: true }], [t]);

  const filters = useMemo(
    () => [
      {
        label: t("Show who removed it"),
        isUpperSide: false,
        node: <SwitchButton checked={showRemoved} onChange={setShowRemoved} />,
        isDisabled: !search,
      },
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
    [t, showInactiveUsers, showRemoved, search, whoKnowsDisabledCondition, user]
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
          isCollapsible={!!search}
          isCollapsibleCheckActive={false}
          title={t("Who Knows?")}
          isSearch={false}
          showOrientationToggle={false}
        />
      </div>
    </>
  );
};

export default WhoKnows;
