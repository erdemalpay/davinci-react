import { subDays } from "date-fns";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import InfoBox from "../components/panelComponents/FormElements/InfoBox";
import { H5 } from "../components/panelComponents/Typography";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { TableCard } from "../components/tables/NewTableCard";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { useDateContext } from "../context/Date.context";
import { Routes } from "../navigation/constants";
import { Game, Table, User } from "../types";
import { useGetGames } from "../utils/api/game";
import { useGetGivenDateOrders } from "../utils/api/order/order";
import { useGetTables } from "../utils/api/table";
import { useGetUsers } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";
import { formatDate, isToday, parseDate } from "../utils/dateUtil";
import { sortTable } from "../utils/sort";

const NewTables = () => {
  const { t } = useTranslation();
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);

  const { setSelectedDate, selectedDate } = useDateContext();
  const [showAllTables, setShowAllTables] = useState(true);
  const [showAllGameplays, setShowAllGameplays] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const navigate = useNavigate();
  const games = useGetGames();
  const visits = useGetVisits();
  const tables = useGetTables();
  const users = useGetUsers();
  const orders = useGetGivenDateOrders();

  tables.sort(sortTable);
  const [tableCardKey, setTableCardKey] = useState(0);
  // Sort users by name
  users.sort((a: User, b: User) => {
    if (a.name > b.name) {
      return 1;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 0;
    }
  });
  visits.sort((a, b) => {
    if (a.user.role.name > b.user.role.name) {
      return 1;
    } else if (a.user.role.name < b.user.role.name) {
      return -1;
    } else if (a.user.name > b.user.name) {
      return 1;
    } else if (a.user.name < b.user.name) {
      return -1;
    } else {
      return 0;
    }
  });

  const defaultUser: User = users.find((user) => user._id === "dv") as User;
  const [mentors, setMentors] = useState<User[]>(
    defaultUser ? [defaultUser] : []
  );
  const activeTables = tables.filter((table) => !table.finishHour);
  const activeTableCount = activeTables.length;
  const totalTableCount = tables.length;
  const activeCustomerCount = activeTables.reduce(
    (prev: number, curr: Table) => {
      return Number(prev) + Number(curr.playerCount);
    },
    0
  );
  const totalCustomerCount = tables.reduce((prev: number, curr: Table) => {
    return Number(prev) + Number(curr.playerCount);
  }, 0);
  const tableColumns: Table[][] = [[], [], [], []];
  (showAllTables ? tables : activeTables).forEach((table, index) => {
    tableColumns[index % 4].push(table);
  });
  useEffect(() => {
    const newMentors = defaultUser ? [defaultUser] : [];
    if (visits) {
      visits.forEach(
        (visit) => !visit.finishHour && newMentors.push(visit.user)
      );
    }
    setMentors((mentors) => {
      if (isEqual(mentors, newMentors)) {
        return mentors;
      } else {
        return newMentors;
      }
    });
  }, [defaultUser, visits]);
  useEffect(() => {
    setTableCardKey((prev) => prev + 1);
  }, [orders, showAllGameplays, showAllOrders]);

  const handleDecrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = subDays(date, 1);
    setSelectedDate(formatDate(newDate));
  };

  const handleIncrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setSelectedDate(formatDate(newDate));
  };

  // filter out unfinished visits and only show one visit per user
  const seenUserIds = new Set<string>();
  const filteredVisits = visits.filter((visit) => {
    const isUnfinished = !visit.finishHour;
    const isUserNotSeen = !seenUserIds.has(visit.user._id);
    if (isUnfinished && isUserNotSeen) {
      seenUserIds.add(visit.user._id);
      return true;
    }

    return false;
  });
  const buttons: { label: string; onClick: () => void }[] = [
    {
      label: t("Open Reservations"),
      onClick: () => {
        navigate(Routes.Reservations);
      },
    },
    {
      label: t("Add table"),
      onClick: () => {
        setIsCreateTableDialogOpen(true);
      },
    },
  ];
  const switchFilters: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }[] = [
    {
      label: t("Show All Orders"),
      checked: showAllOrders,
      onChange: setShowAllOrders,
    },
    {
      label: t("Show All Gameplays"),
      checked: showAllGameplays,
      onChange: setShowAllGameplays,
    },
    {
      label: t("Show Closed Tables"),
      checked: showAllTables,
      onChange: setShowAllTables,
    },
  ];
  return (
    <>
      <Header />
      <div className="container relative h-full py-4 px-2 lg:px-12 ">
        <div className="h-full flex w-full flex-wrap flex-col">
          <div className="flex lg:justify-between justify-center flex-col lg:flex-row">
            <div className="flex flex-row items-center w-full text-3xl">
              <IoIosArrowBack
                className="text-xl"
                onClick={() => {
                  handleDecrementDate(selectedDate ?? "");
                }}
              />
              <DateInput
                date={parseDate(selectedDate)}
                setDate={setSelectedDate}
              />
              <IoIosArrowForward
                className="text-xl"
                onClick={() => {
                  handleIncrementDate(selectedDate ?? "");
                }}
              />
            </div>
            {/* buttons */}
            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 mt-2 md:mt-0 md:mr-40">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className="min-w-fit transition duration-150 ease-in-out hover:bg-blue-900 hover:text-white active:bg-blue-700 active:text-white rounded-lg border border-gray-800 text-gray-800 px-4 py-2 text-sm"
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col  md:flex-row  items-center  mt-4 md:mt-2">
            {/*Cafe info opentables ...  */}
            {(activeTableCount > 0 ||
              totalTableCount > 0 ||
              activeCustomerCount > 0 ||
              totalCustomerCount > 0) && (
              <div className="relative w-80 h-28 border border-gray-400 rounded-md ">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2   ">
                  <InfoBox
                    title={t("Open Table")}
                    count={activeTableCount}
                    className="rounded-tl-2xl"
                  />
                  <InfoBox
                    title={t("Total Table")}
                    count={totalTableCount}
                    className=" rounded-tr-2xl"
                  />
                  <InfoBox
                    title={t("Active Customer")}
                    count={activeCustomerCount}
                    className=" rounded-bl-2xl "
                  />
                  <InfoBox
                    title={t("Total Customer")}
                    count={totalCustomerCount}
                    className="rounded-br-2xl"
                  />
                </div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-full h-[1px] bg-gray-400" />
                </div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="h-full w-[1px] bg-gray-400" />
                </div>
              </div>
            )}
            <div className="flex flex-col md:ml-8 justify-between w-full px-2 md:px-0 mt-2 md:mt-0">
              {/* who is/was at the cafe */}
              {selectedDate && isToday(selectedDate) ? (
                <ActiveVisitList
                  suggestions={users}
                  name="employees"
                  label={t("Who's at cafe?")}
                  visits={visits.filter((visit) => !visit.finishHour)}
                />
              ) : (
                <PreviousVisitList visits={filteredVisits} />
              )}

              {/* filters */}
              <div className="flex  gap-4 justify-end mt-4  ">
                {switchFilters.map((filter, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <H5>{filter.label}</H5>
                    <SwitchButton
                      checked={filter.checked}
                      onChange={filter.onChange as any}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-full hidden lg:grid grid-cols-4 mt-6 gap-x-8">
          {tableColumns.map((tables, idx) => (
            <div key={idx}>
              {tables.map((table) => (
                <TableCard
                  key={table._id || table.startHour + tableCardKey}
                  table={table}
                  mentors={mentors}
                  games={games}
                  showAllGameplays={showAllGameplays}
                  showAllOrders={showAllOrders}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="h-full grid lg:hidden grid-cols-1 mt-4 gap-x-8">
          {tables.map((table) => (
            <TableCard
              key={table._id || table.startHour + tableCardKey}
              table={table}
              mentors={mentors}
              games={games as Game[]}
              showAllGameplays={showAllGameplays}
              showAllOrders={showAllOrders}
            />
          ))}
        </div>
      </div>
      {isCreateTableDialogOpen && (
        <CreateTableDialog
          isOpen={isCreateTableDialogOpen}
          close={() => setIsCreateTableDialogOpen(false)}
        />
      )}
    </>
  );
};

export default NewTables;
