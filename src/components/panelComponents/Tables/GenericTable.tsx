import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../../context/General.context";
import { Caption, H4, H5, P1 } from "../Typography";
import {
  ActionType,
  ColumnType,
  FilterType,
  RowKeyType,
} from "../shared/types";
import ButtonTooltip from "./ButtonTooltip";
import Tooltip from "./Tooltip";
import "./table.css";

type Props<T> = {
  rows: T[];
  columns: ColumnType[];
  rowKeys: RowKeyType<T>[];
  actions?: ActionType<T>[];
  title?: string;
  addButton?: ActionType<T>;
  imageHolder?: string;
  tooltipLimit?: number;
  rowsPerPageOptions?: number[];
  filters?: FilterType<T>[];
  isRowsPerPage?: boolean;
};

const GenericTable = <T,>({
  rows,
  columns,
  rowKeys,
  actions,
  title,
  addButton,
  filters,
  imageHolder,
  isRowsPerPage = true,
  tooltipLimit = 40,
  rowsPerPageOptions = [10, 20, 50],
}: Props<T>) => {
  const { currentPage, setCurrentPage, rowsPerPage, setRowsPerPage } =
    useGeneralContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tableRows, setTableRows] = useState(rows);

  const initialRows = () => {
    if (searchQuery === "" && rows.length > 0 && tableRows.length === 0) {
      setTableRows(rows);
      return rows;
    } else {
      return tableRows;
    }
  };
  const filteredRows = initialRows().filter((row) =>
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
  const currentRows = isRowsPerPage
    ? filteredRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      )
    : filteredRows;

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

    if (action.onClick) {
      action.onClick(row);
    }
    if (action?.isModal && action.setIsModal) {
      action?.setIsModal(true);
    } else if (action.isPath && action.path) {
      navigate(action.path);
    }
  };
  const renderActionButtons = (row: T) => (
    <div className=" flex flex-row my-auto h-full  gap-3 ">
      {actions?.map((action, index) => {
        if (action?.isDisabled) {
          return null;
        }
        if (action.node) {
          return <div key={index}>{action.node(row)}</div>;
        }
        return (
          <div
            key={index}
            className={`rounded-full  h-6 w-6 flex my-auto items-center justify-center ${action?.className}`}
            onClick={() => {
              actionOnClick(action, row);
            }}
          >
            <ButtonTooltip content={action.name}>{action.icon}</ButtonTooltip>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className=" mx-auto flex flex-col gap-4 __className_a182b8">
      {/* search button */}

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search..."
        className="border border-gray-200 rounded-md py-2 px-3 w-fit focus:outline-none"
      />

      <div className="flex flex-col bg-white border border-gray-100 shadow-sm rounded-lg   ">
        {/* header part */}
        <div className="flex flex-row  justify-between items-center gap-4  px-6 border-b border-gray-200  py-4 overflow-scroll ">
          {title && <H4 className="mr-auto">{title}</H4>}
          <div className="ml-auto flex flex-row gap-10 justify-center items-center   ">
            {/* filters */}
            {filters &&
              filters.map((filter, index) => (
                <div
                  key={index}
                  className="flex flex-row gap-2 justify-center items-center"
                >
                  {filter.label && <H5>{filter.label}</H5>}
                  {filter.node}
                </div>
              ))}
            {/* add button */}
            {addButton && (
              <button
                className={`px-2 sm:px-3 py-1 h-fit w-fit ${
                  addButton.className
                    ? `${addButton.className}`
                    : "bg-black border-black hover:text-black"
                } text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer`}
                onClick={() => actionOnClick(addButton, {} as unknown as T)}
              >
                <H5>{addButton.name}</H5>
              </button>
            )}
          </div>
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
                        columns.length === 2 && "justify-between  "
                      } ${index === 0 ? "pl-3" : ""}  py-3  min-w-8`}
                    >
                      <H5
                        className={`w-fit flex gap-2 ${
                          columns.length === 2 && index == 1 && "  mx-auto"
                        } `}
                      >
                        {column.key}{" "}
                        {column.isSortable && (
                          <div
                            className="sort-buttons"
                            style={{ display: "inline-block" }}
                          >
                            {sortConfig?.key === rowKeys[index]?.key &&
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
                      if (rowKey.node) {
                        return (
                          <td
                            key={keyIndex}
                            className={`${
                              keyIndex === 0 ? "pl-3" : ""
                            } py-3 min-w-20 ${rowKey?.className} `}
                          >
                            {rowKey.node(row)}
                          </td>
                        );
                      }
                      if (
                        !rowKey?.isImage &&
                        row[rowKey.key as keyof T] === undefined
                      ) {
                        return (
                          <td
                            key={keyIndex}
                            className={`${
                              keyIndex === 0 ? "pl-3" : ""
                            } py-3 min-w-20 ${rowKey?.className} `}
                          >
                            -
                          </td>
                        );
                      }
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
                        style = {
                          color: matchedOption?.textColor,
                          backgroundColor: matchedOption?.bgColor,
                        };
                        return (
                          <td
                            key={keyIndex}
                            className={`${
                              keyIndex === 0 ? "pl-3" : ""
                            }  py-3  ${rowKey?.className} min-w-32 md:min-w-0 `}
                          >
                            <P1
                              className="w-fit px-2 py-1 rounded-md "
                              style={style}
                            >
                              {matchedOption?.label}
                            </P1>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={keyIndex}
                          className={`${keyIndex === 0 ? "pl-3" : ""} py-3 ${
                            rowKey?.className
                          } min-w-20 md:min-w-0
                           ${
                             columns.length === 2 &&
                             keyIndex === 1 &&
                             "text-center "
                           }`}
                        >
                          {rowKey.isImage ? (
                            <img
                              src={
                                (row[rowKey.key as keyof T] as string) ||
                                imageHolder
                              }
                              alt="img"
                              className="w-12 h-12 rounded-full"
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
                    <td>{actions && renderActionButtons(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && isRowsPerPage && (
            <div className="w-fit ml-auto flex flex-row gap-4">
              {/* Rows per page */}
              <div className="flex flex-row gap-2 px-6 items-center">
                <Caption>Rows per page:</Caption>
                <select
                  className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    const totalNewPages = Math.ceil(
                      totalRows / Number(e.target.value)
                    );
                    if (currentPage > totalNewPages) {
                      setCurrentPage(totalNewPages);
                    }
                  }}
                >
                  {rowsPerPageOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination */}

              <div className=" flex flex-row gap-2 items-center">
                <Caption>
                  {Math.min((currentPage - 1) * rowsPerPage + 1, totalRows)}–
                  {Math.min(currentPage * rowsPerPage, totalRows)} of{" "}
                  {totalRows}
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
          )}
        </div>
        {/* action modal if there is */}
        {actions?.map((action, index) => {
          if (action?.isModal && action?.isModalOpen && action?.modal) {
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
