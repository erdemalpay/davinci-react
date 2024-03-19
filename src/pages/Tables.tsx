import { Switch } from "@headlessui/react";
import { format, subDays } from "date-fns";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { DateInput } from "../components/common/DateInput2";
import { InputWithLabel } from "../components/common/InputWithLabel";
import { Header } from "../components/header/Header";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { TableCard } from "../components/tables/TableCard";
import { useDateContext } from "../context/Date.context";
import { Routes } from "../navigation/constants";
import { Game, Table, User } from "../types";
import { useGetGames } from "../utils/api/game";
import { useCloseAllTableMutation, useGetTables } from "../utils/api/table";
import { useGetUsers } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";
import { formatDate, isToday, parseDate } from "../utils/dateUtil";
import { sortTable } from "../utils/sort";

const TablesPage = () => {
  const { t } = useTranslation();
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { setSelectedDate, selectedDate } = useDateContext();
  const [showAllTables, setShowAllTables] = useState(true);
  const navigate = useNavigate();
  const { mutate: closeAllTables } = useCloseAllTableMutation();
  const games = useGetGames();
  const visits = useGetVisits();
  const tables = useGetTables();
  const users = useGetUsers();

  // Sort tables first active tables, then closed ones.
  // if both active then sort by name
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
  const handleCloseAllTables = () => {
    const finishHour = format(new Date(), "HH:mm");
    const ids = tables.filter((t) => !t.finishHour).map((t) => t._id);
    closeAllTables({ ids, finishHour });
    setIsCloseAllConfirmationDialogOpen(false);
  };

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

  return (
    <>
      <Header />
      <div className="container relative h-full py-4 px-2 lg:px-12">
        <div className="h-full flex w-full flex-wrap flex-col">
          <div className="flex lg:justify-between justify-center flex-col lg:flex-row">
            <div className="flex flex-row gap-2 items-center w-full text-3xl">
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
            <div className="flex justify-between gap-x-4">
              <button
                onClick={() => setIsCloseAllConfirmationDialogOpen(true)}
                className="sm:min-w-32 my-3 bg-white transition duration-150 ease-in-out hover:border-gray-900 hover:text-gray-900 rounded border border-gray-800 text-gray-800 px-6 text-sm "
              >
                {t("Close all tables")}
              </button>
              <button
                onClick={() => navigate(Routes.Reservations)}
                className="my-3 bg-white transition duration-150 ease-in-out hover:border-gray-900 hover:text-gray-900 rounded border border-gray-800 text-gray-800 px-6 text-sm"
              >
                {t("Open Reservations")}
              </button>
              <button
                onClick={() => setIsCreateTableDialogOpen(true)}
                className="my-3 bg-white transition duration-150 ease-in-out hover:border-gray-900 hover:text-gray-900 rounded border border-gray-800 text-gray-800 px-6 text-sm"
              >
                {t("Add table")}
              </button>
            </div>
          </div>
          <div className="flex flex-col  md:flex-row gap-8">
            <div className="flex flex-col md:flex-row md:gap-16 w-full">
              <InputWithLabel
                name="activeTable"
                label={t("Open Table")}
                type="number"
                readOnly
                className="w-full"
                value={activeTableCount}
              />
              <InputWithLabel
                name="totalTable"
                label={t("Total Table")}
                type="number"
                readOnly
                className="w-full"
                value={totalTableCount}
              />

              <InputWithLabel
                name="activeCustomer"
                label={t("Active Customer")}
                type="number"
                readOnly
                className="w-full"
                value={activeCustomerCount}
              />
              <InputWithLabel
                name="totalCustomer"
                label={t("Total Customer")}
                type="number"
                readOnly
                className="w-full"
                value={totalCustomerCount}
              />
            </div>
          </div>
          {selectedDate && isToday(selectedDate) ? (
            <ActiveVisitList
              suggestions={users}
              name="employees"
              label={t("Who's at cafe?")}
              visits={visits.filter((visit) => !visit.finishHour)}
            />
          ) : (
            <PreviousVisitList visits={visits} />
          )}
        </div>
        <div className="flex justify-end gap-4 items-center">
          <h1 className="text-md">{t("Show Closed Tables")}</h1>
          <Switch
            checked={showAllTables}
            onChange={() => setShowAllTables((value) => !value)}
            className={`${showAllTables ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
          >
            <span
              aria-hidden="true"
              className={`${showAllTables ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>
        <div className="h-full hidden lg:grid grid-cols-4 mt-4 gap-x-8">
          {tableColumns.map((tables, idx) => (
            <div key={idx}>
              {tables.map((table) => (
                <TableCard
                  key={table._id || table.startHour}
                  table={table}
                  mentors={mentors}
                  games={games}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="h-full grid lg:hidden grid-cols-1 mt-4 gap-x-8">
          {tables.map((table) => (
            <TableCard
              key={table._id || table.startHour}
              table={table}
              mentors={mentors}
              games={games as Game[]}
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
      <ConfirmationDialog
        isOpen={isCloseAllConfirmationDialogOpen}
        close={() => setIsCloseAllConfirmationDialogOpen(false)}
        confirm={handleCloseAllTables}
        title={t("Close All Table")}
        text={t("CloseTableMessage")}
      />
    </>
  );
};

// TablesPage.whyDidYouRender = true;

export default TablesPage;
