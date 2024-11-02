import { useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import InfoBox from "../components/panelComponents/FormElements/InfoBox";
import { H5 } from "../components/panelComponents/Typography";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { TableCard } from "../components/tables/TableCard";
import { useDateContext } from "../context/Date.context";
import { Routes } from "../navigation/constants";
import { Game, Order, OrderStatus, Table, TableStatus, User } from "../types";
import { useGetGames } from "../utils/api/game";
import { useGetTodayOrders } from "../utils/api/order/order";
import { useGetTables } from "../utils/api/table";
import { useGetUsers } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";
import { formatDate, isToday, parseDate } from "../utils/dateUtil";
import { getItem } from "../utils/getItem";
import { sortTable } from "../utils/sort";

const Tables = () => {
  const { t } = useTranslation();
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);
  const { setSelectedDate, selectedDate } = useDateContext();
  const [showAllTables, setShowAllTables] = useState(true);
  const [showAllGameplays, setShowAllGameplays] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [showServedOrders, setShowServedOrders] = useState(true);
  const todayOrders = useGetTodayOrders();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const games = useGetGames();
  const visits = useGetVisits();
  const tables = useGetTables()
    .filter((table) => !table?.isOnlineSale)
    .filter((table) => table?.status !== TableStatus.CANCELLED);
  const users = useGetUsers();

  tables.sort(sortTable);
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
  visits?.sort((a, b) => {
    const aUser = getItem(a.user, users);
    const bUser = getItem(b.user, users);
    const aUserRole = aUser?.role?.name as string;
    const bUserRole = bUser?.role?.name as string;
    if (aUserRole > bUserRole) {
      return 1;
    } else if (aUserRole < bUserRole) {
      return -1;
    } else if ((aUser?.name as string) > (bUser?.name as string)) {
      return 1;
    } else if ((aUser?.name as string) < (bUser?.name as string)) {
      return -1;
    } else {
      return 0;
    }
  });
  const defaultUser: User = users.find((user) => user._id === "dv") as User;
  const [mentors, setMentors] = useState<User[]>(
    defaultUser ? [defaultUser] : []
  );
  const activeTables = tables.filter((table) => !table?.finishHour);
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
      visits.forEach((visit) => {
        const user = getItem(visit.user, users) as User;
        if (user && !visit?.finishHour && !newMentors.includes(user)) {
          newMentors.push(user);
        }
      });
    }

    setMentors((mentors) => {
      if (isEqual(mentors, newMentors)) {
        return mentors;
      } else {
        return newMentors;
      }
    });
  }, [defaultUser, visits]);

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
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      const offset = -100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition + offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const bgColor = (table: Table) => {
    const tableOrders = todayOrders?.filter(
      (order) => (order.table as Table)?._id === table?._id
    );
    return tableOrders?.some(
      (tableOrder) => (tableOrder as Order)?.status === OrderStatus.READYTOSERVE
    )
      ? "bg-orange-200"
      : "bg-gray-100";
  };
  // filter out unfinished visits and only show one visit per user

  const seenUserIds = new Set<string>();
  const filteredVisits = visits.filter((visit) => {
    const isUnfinished = !visit.finishHour;
    const isUserNotSeen = !seenUserIds.has(visit.user);
    if (isUnfinished && isUserNotSeen) {
      seenUserIds.add(visit.user);
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
      label: t("Show Served Orders"),
      checked: showServedOrders,
      onChange: setShowServedOrders,
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
            {/* Table name buttons for small screen */}
            <div className="flex flex-wrap gap-2 mt-4 sm:hidden">
              {tables
                ?.filter((table) => !table?.finishHour)
                ?.map((table) => (
                  <a
                    key={table?._id + "tableselector"}
                    onClick={() => scrollToSection(`table-${table?._id}`)}
                    className={` bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium ${bgColor(
                      table
                    )}`}
                  >
                    {table?.name}
                  </a>
                ))}
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
          {/* Table name buttons for big screen */}
          <div className=" flex-wrap gap-2 my-4 hidden sm:flex">
            {tables
              ?.filter((table) => !table?.finishHour)
              ?.map((table) => (
                <a
                  key={table?._id + "tableselector"}
                  onClick={() => scrollToSection(`table-large-${table?._id}`)}
                  className={` bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium cursor-pointer ${bgColor(
                    table
                  )}`}
                >
                  {table?.name}
                </a>
              ))}
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
                  visits={visits}
                />
              ) : (
                <PreviousVisitList visits={filteredVisits} />
              )}

              {/* filters */}
              <div className="grid grid-cols-2 md:flex md:flex-row md:gap-4 justify-end mt-4">
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

        <div className="h-full hidden lg:grid grid-cols-4 mt-6 gap-x-8 ">
          {tableColumns.map((tablesColumns, idx) => (
            <div key={idx}>
              {tablesColumns.map((table) => (
                <div
                  id={`table-large-${table?._id}`}
                  key={table?._id || table?.startHour}
                >
                  <TableCard
                    key={table?._id || table?.startHour}
                    table={table}
                    mentors={mentors}
                    games={games}
                    showAllGameplays={showAllGameplays}
                    showAllOrders={showAllOrders}
                    showServedOrders={showServedOrders}
                    tables={tables}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="h-full grid lg:hidden grid-cols-1 mt-4 gap-x-8">
          {tables.map((table) => (
            <div
              id={`table-${table?._id}`}
              key={table?._id || table?.startHour}
            >
              <TableCard
                table={table}
                mentors={mentors}
                games={games as Game[]}
                showAllGameplays={showAllGameplays}
                showAllOrders={showAllOrders}
                showServedOrders={showServedOrders}
                tables={tables}
              />
            </div>
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

export default Tables;
