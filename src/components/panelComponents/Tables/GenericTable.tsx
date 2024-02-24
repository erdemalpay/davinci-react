import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Caption, H4, H5, P1 } from "../Typography";
import { ActionType, RowKeyType } from "../shared/types";
import Tooltip from "./Tooltip";
import "./table.css";

type Props<T> = {
  rows: T[];
  columns: string[];
  rowKeys: RowKeyType[];
  actions: ActionType<T>[];
  title: string;
  addButton?: ActionType<T>;
};

const GenericTable = <T,>({
  rows,
  columns,
  rowKeys,
  actions,
  title,
  addButton,
}: Props<T>) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableRows, setTableRows] = useState(rows);
  const tooltipLimit = 35;
  const filteredRows = tableRows.filter((row) =>
    rowKeys.some((rowKey) => {
      const value = row[rowKey.key as keyof typeof row];
      const query = searchQuery.toLowerCase();

      if (typeof value === "string") {
        return value.toLowerCase().includes(query);
      } else if (typeof value === "number") {
        return value.toString().includes(query);
      } else if (typeof value === "boolean") {
        return (value ? "true" : "false").includes(query);
      }
      return false;
    })
  );
  const totalRows = filteredRows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const currentRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const [sortConfig, setSortConfig] = useState<{
    key: Extract<keyof T, string>;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortRows = (key: Extract<keyof T, string>) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });

    const sortedRows = [...tableRows].sort((a, b) => {
      const isNumeric = !isNaN(Number(a[key])) && !isNaN(Number(b[key]));

      let valA = isNumeric ? Number(a[key]) : String(a[key]).toLowerCase();
      let valB = isNumeric ? Number(b[key]) : String(b[key]).toLowerCase();

      if (valA < valB) {
        return direction === "ascending" ? -1 : 1;
      }
      if (valA > valB) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    setTableRows(sortedRows);
  };

  const actionOnClick = (action: ActionType<T>, row: T) => {
    if (action.setRow) {
      action.setRow(row);
    }
    if (action?.isModal && action.setIsModal && action.modal) {
      action?.setIsModal(true);
    } else if (action.isPath && action.path) {
      navigate(action.path);
    }
  };
  const renderActionButtons = (row: T) => (
    <td className="py-3 flex gap-3">
      {actions.map((action, index) => (
        <div
          key={index}
          className="rounded-full hover:bg-gray-200 h-6 w-6 flex items-center justify-center"
          onClick={() => actionOnClick(action, row)}
        >
          {action.icon}
        </div>
      ))}
    </td>
  );

  return (
    <div className="w-5/6 mx-auto flex flex-col gap-4 __className_a182b8">
      {/* search button */}

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="border border-gray-200 rounded-md py-2 px-3 w-fit focus:outline-none"
      />

      <div className="flex flex-col bg-white border border-gray-100 shadow-sm rounded-lg overflow-x-hidden  ">
        {/* header part */}
        <div className="flex flex-row justify-between items-center px-6 border-b border-gray-200  py-4">
          <H4>{title}</H4>
          {/* add button */}
          {addButton && (
            <button
              className={`px-3 py-1 h-fit w-fit ${
                addButton.bgColor
                  ? `bg-${addButton.bgColor} border-${addButton.bgColor} hover:text-${addButton.bgColor}`
                  : "bg-black border-black hover:text-black"
              } text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer`}
              onClick={() => actionOnClick(addButton, {} as unknown as T)}
            >
              <H5>{addButton.name}</H5>
            </button>
          )}
        </div>
        {/* table part */}
        <div className="px-6 py-4 flex flex-col gap-4 overflow-scroll ">
          <div className="border border-gray-100 rounded-md w-full   ">
            <table className="bg-white w-full ">
              <thead className="border-b  ">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`${
                        index === 0 ? "pl-3" : ""
                      } text-left py-3 relative`}
                    >
                      <H5 className="flex gap-2">
                        {column}{" "}
                        {column !== "Action" && (
                          <div
                            className="sort-buttons"
                            style={{ display: "inline-block" }}
                          >
                            {sortConfig?.key === rowKeys[index].key &&
                            sortConfig?.direction === "ascending" ? (
                              <button
                                onClick={() =>
                                  sortRows(
                                    rowKeys[index].key as Extract<
                                      keyof T,
                                      string
                                    >
                                  )
                                }
                              >
                                ↓
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  sortRows(
                                    rowKeys[index].key as Extract<
                                      keyof T,
                                      string
                                    >
                                  )
                                }
                              >
                                ↑
                              </button>
                            )}
                          </div>
                        )}
                      </H5>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex !== currentRows.length - 1 ? "border-b" : ""
                    }`}
                  >
                    {rowKeys.map((rowKey, keyIndex) => {
                      const cellValue = `${row[rowKey.key as keyof T]}`;
                      const displayValue =
                        cellValue.length > tooltipLimit
                          ? `${cellValue.substring(0, tooltipLimit)}...`
                          : cellValue;

                      let style = {};

                      if (rowKey.isOptional && rowKey.options) {
                        const matchedOption = rowKey.options.find(
                          (option) =>
                            option.label === String(row[rowKey.key as keyof T])
                        );
                        rowKey.paddingX = rowKey.paddingX
                          ? rowKey.paddingX
                          : "0.5rem";
                        rowKey.paddingY = rowKey.paddingY
                          ? rowKey.paddingY
                          : "0.2rem";
                        const padding = rowKey.paddingY + " " + rowKey.paddingX;
                        if (matchedOption) {
                          style = {
                            backgroundColor: matchedOption.bgColor,
                            color: matchedOption.textColor,
                            padding: padding,
                            borderRadius: "0.375rem",
                            width: rowKey?.width ?? "fit-content",
                            textAlign: "center",
                          };
                        }
                      }

                      return (
                        <td
                          key={keyIndex}
                          className={`${keyIndex === 0 ? "pl-3" : ""} py-3 `}
                        >
                          {rowKey.isImage ? (
                            <img
                              src={row[rowKey.key as keyof T] as string}
                              alt="img"
                              className="w-10 h-10 rounded-full"
                            />
                          ) : cellValue.length > tooltipLimit ? (
                            <Tooltip content={cellValue}>
                              <P1>{displayValue}</P1>
                            </Tooltip>
                          ) : (
                            <P1 style={style}>{displayValue}</P1>
                          )}
                        </td>
                      );
                    })}
                    {actions && renderActionButtons(row)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-fit ml-auto flex flex-row gap-4">
            {/* Rows per page */}
            <div className="flex flex-row gap-2 px-6 items-center">
              <Caption>Rows per page:</Caption>
              <select
                className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Pagination */}
            <div className=" flex flex-row gap-2 items-center">
              <Caption>
                {Math.min((currentPage - 1) * rowsPerPage + 1, totalRows)}–
                {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}
              </Caption>
              <div className="flex flex-row gap-4">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="cursor-pointer"
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="cursor-pointer"
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* action modal if there is */}
        {actions.map((action, index) => {
          if (action?.isModal && action?.isModalOpen && action.modal) {
            return <div key={index}>{action.modal}</div>;
          }
        })}
        {/* addbutton modal if there is  */}
        {addButton?.isModal && addButton?.isModalOpen && addButton?.modal && (
          <div>{addButton.modal}</div>
        )}
      </div>
    </div>
  );
};

export default GenericTable;