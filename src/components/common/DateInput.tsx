import DatePicker from "react-datepicker";

export function DateInput({ ...props }) {
  return (
    <div className="relative mt-10 h-full">
      <DatePicker
        {...props}
        className="border-0 border-b-2 text-2xl peer placeholder-transparent"
        selected={props.date}
        onChange={(date) => props.setDate(date as Date)}
        nextMonthButtonLabel=">"
        previousMonthButtonLabel="<"
        popperClassName="react-datepicker-left"
        calendarStartDay={1}
        dateFormat="dd/MM/yyyy"
      />
      <label
        htmlFor="date"
        className="text-gray-800 dark:text-gray-100 text-xs absolute left-0 -top-3.5 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs"
      >
        Date
      </label>
    </div>
  );
}
