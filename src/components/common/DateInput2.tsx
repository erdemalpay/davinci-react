import {
  Input,
  Popover,
  PopoverContent,
  PopoverHandler,
} from "@material-tailwind/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "react-i18next";
interface Props {
  date: Date;
  setDate: (date: string) => void;
}

export function DateInput({ date, setDate }: Props) {
  const { t } = useTranslation();

  const [month, setMonth] = useState<Date>(date);
  useEffect(() => {
    setMonth(date);
  }, [date]);

  return (
    <div className="p-2">
      <Popover placement="bottom">
        <PopoverHandler>
          <Input
            label={t("Select a Date")}
            readOnly
            value={date ? format(date, "dd/MM/yyyy") : ""}
            onChange={() => null}
          />
        </PopoverHandler>
        <PopoverContent>
          <DayPicker
            mode="single"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            locale={tr}
            onSelect={(day) => {
              if (day) {
                setDate(format(day, "yyyy-MM-dd"));
                setMonth(day);
              }
            }}
            showOutsideDays
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
