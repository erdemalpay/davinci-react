import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useGetUsersMinimal } from "../../utils/api/user";
import { useGetGivenDateVisits } from "../../utils/api/visit";
import { formatDate, parseDate } from "../../utils/dateUtil";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { DateInput } from "../common/DateInput2";
import GenericTable from "../panelComponents/Tables/GenericTable";

export default function DailyVisit() {
  const { t } = useTranslation();
  const users = useGetUsersMinimal();
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const givenDateVisits = useGetGivenDateVisits(selectedDate);

  const rows = useMemo(() => {
    const allRows = givenDateVisits?.reduce((acc, visit) => {
      const foundUser = getItem(visit.user, users);
      if (!foundUser) return acc;
      const visitHours = `${visit.startHour}${
        visit.finishHour ? " - " + visit.finishHour : ""
      }`;
      const existingEntry = acc.find((entry) => entry.userId === visit.user);
      if (existingEntry) {
        existingEntry.visitHoursList.push(visitHours);
        existingEntry.visitHours = "";
        existingEntry.collapsible = {
          collapsibleColumns: [{ key: "Visit Start - End", isSortable: true }],
          collapsibleRows: existingEntry.visitHoursList.map((hours) => ({
            hours: hours,
          })),
          collapsibleRowKeys: [{ key: "hours" }],
        };
      } else {
        acc.push({
          userId: visit.user,
          userName: foundUser.name,
          visitDate: formatAsLocalDate(visit.date),
          visitHoursList: [visitHours],
          visitHours: visitHours,
          collapsible: {
            collapsibleColumns: [
              { key: "Visit Start - End", isSortable: true },
            ],
            collapsibleRows: [],
            collapsibleRowKeys: [{ key: "hours" }],
          },
        });
      }

      return acc;
    }, [] as Array<{ userId: string; userName: string; visitDate: string; visitHours: string; visitHoursList: string[]; collapsible: any }>);
    return allRows || [];
  }, [givenDateVisits, users]);

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Visit Hours"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "userName" }, { key: "visitHours" }],
    []
  );

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

  const filters = useMemo(
    () => [
      {
        isUpperSide: true,
        node: (
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
        ),
      },
    ],
    [selectedDate]
  );

  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isActionsActive={false}
          filters={filters}
          title={t("Visits")}
          isCollapsible={true}
        />
      </div>
    </>
  );
}
