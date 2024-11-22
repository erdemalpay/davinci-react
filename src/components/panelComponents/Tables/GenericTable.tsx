import "pdfmake/build/pdfmake";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFilePdf } from "react-icons/bs";
import { FaFileExcel } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { GoPlusCircle } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useGeneralContext } from "../../../context/General.context";
import { RowPerPageEnum } from "../../../types";
import ImageModal from "../Modals/ImageModal";
import { Caption, H4, H5, P1 } from "../Typography";
import {
  ActionType,
  ColumnType,
  FilterType,
  PanelFilterType,
  RowKeyType,
} from "../shared/types";
import ButtonTooltip from "./ButtonTooltip";
import FilterPanel from "./FilterPanel";
import Tooltip from "./Tooltip";
import "./table.css";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowPerPage: number) => void;
  totalRows: number;
};

type Props<T> = {
  rows: any[];
  isDraggable?: boolean;
  onDragEnter?: (DraggedRow: T, TargetRow: T) => void;
  isActionsActive: boolean;
  columns: ColumnType<T>[];
  isCollapsible?: boolean;
  rowKeys: RowKeyType<T>[];
  actions?: ActionType<T>[];
  isPdf?: boolean;
  collapsibleActions?: ActionType<T>[];
  title?: string;
  addButton?: ActionType<T>;
  addCollapsible?: ActionType<T>;
  filterPanel?: PanelFilterType<T>;
  outsideSearch?: () => React.ReactNode;
  imageHolder?: string;
  tooltipLimit?: number;
  rowsPerPageOptions?: number[];
  filters?: FilterType<T>[];
  isRowsPerPage?: boolean;
  rowClassNameFunction?: (row: T) => string;
  isSearch?: boolean;
  isPagination?: boolean;
  isActionsAtFront?: boolean;
  isCollapsibleCheckActive?: boolean;
  isExcel?: boolean;
  excelFileName?: string;
  pagination?: PaginationProps;
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
  addCollapsible,
  isActionsActive = true,
  isDraggable = false,
  filterPanel,
  collapsibleActions,
  onDragEnter,
  outsideSearch,
  isSearch = true,
  isPdf = false,
  isExcel = false,
  isCollapsible = false,
  isPagination = true,
  isRowsPerPage = true,
  isActionsAtFront = false,
  isCollapsibleCheckActive = true,
  tooltipLimit = 40,
  rowClassNameFunction,
  excelFileName,
  rowsPerPageOptions = [
    RowPerPageEnum.FIRST,
    RowPerPageEnum.SECOND,
    RowPerPageEnum.THIRD,
  ],
  pagination,
}: Props<T>) => {
  const { t } = useTranslation();
  const {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    expandedRows,
    searchQuery,
    setSearchQuery,
    setExpandedRows,
    setSortConfigKey,
    sortConfigKey,
  } = useGeneralContext();
  const navigate = useNavigate();
  const usedCurrentPage = pagination ? pagination.currentPage : currentPage;
  const usedRowsPerPage = pagination ? pagination.rowsPerPage : rowsPerPage;
  const usedSetCurrentPage = pagination
    ? pagination.setCurrentPage
    : setCurrentPage;
  const usedSetRowsPerPage = pagination
    ? pagination.setRowsPerPage
    : setRowsPerPage;
  const [tableRows, setTableRows] = useState(rows);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState("");
  const initialRows = () => {
    if (searchQuery === "" && rows.length > 0 && tableRows.length === 0) {
      setTableRows(rows);
      return rows;
    } else {
      return tableRows;
    }
  };
  const filteredRows = !isSearch
    ? initialRows()
    : initialRows().filter((row) =>
        rowKeys.some((rowKey) => {
          const value = row[rowKey.key as keyof typeof row];
          const query = searchQuery.trimStart().toLocaleLowerCase("tr-TR");
          if (typeof value === "string") {
            return value.toLocaleLowerCase("tr-TR").includes(query);
          } else if (typeof value === "number") {
            return value.toString().includes(query);
          } else if (typeof value === "boolean") {
            return (value ? "true" : "false").includes(query);
          }
          return false;
        })
      );
  const totalRows = filteredRows.length;
  const usedTotalRows = pagination ? pagination.totalRows : totalRows;
  const totalPages = Math.ceil(usedTotalRows / usedRowsPerPage);

  const usedTotalPages = pagination ? pagination.totalPages : totalPages;
  const currentRows =
    isRowsPerPage && !pagination
      ? filteredRows.slice(
          (usedCurrentPage - 1) * usedRowsPerPage,
          usedCurrentPage * usedRowsPerPage
        )
      : filteredRows;
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortRows = (key: string, direction: "ascending" | "descending") => {
    setSortConfig({ key, direction });
    setSortConfigKey({ key, direction });

    const sortedRows = [...tableRows].sort((a, b) => {
      const isSortable =
        (a["isSortable"] !== undefined ? a["isSortable"] : true) &&
        (b["isSortable"] !== undefined ? b["isSortable"] : true);
      if (!isSortable) {
        return 0;
      }
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

  const handleDragStart = (
    e: React.DragEvent<HTMLTableRowElement>,
    draggedRow: T
  ) => {
    e.dataTransfer.setData("draggedRow", JSON.stringify(draggedRow));
  };
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetRow: T
  ) => {
    e.preventDefault();
    const draggedRowData = e.dataTransfer.getData("draggedRow");
    const draggedRow: T = JSON.parse(draggedRowData);

    if (onDragEnter) {
      onDragEnter(draggedRow, targetRow);
    }
  };
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [rowId]: !prevExpandedRows[rowId],
    }));
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
  const generatePDF = () => {
    const pdfMake = (window as any).pdfMake;
    const data = [];
    let isGray = false;

    // Dynamic columns headers based on props
    data.push(
      columns
        .filter((column) => column.correspondingKey)
        ?.map((column) => ({
          text: column.key, // Adjust based on your actual column definition
          style: "tableHeader",
        }))
    );
    // Dynamic rows data based on filtered and sorted data
    rows.forEach((row) => {
      const rowData: any[] = [];

      columns.forEach((column) => {
        if (column.correspondingKey) {
          const value = String(row[column.correspondingKey]);
          rowData.push(value);
        }
      });

      // Toggle row background color
      isGray = !isGray;

      data.push([...rowData]);
    });

    const documentDefinition = {
      content: [
        {
          table: {
            headerRows: 1,
            body: data,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              return rowIndex === 0
                ? "#000080"
                : rowIndex % 2 === 0
                ? "#d8d2d2"
                : "#ffffff";
            },
          },
        },
      ],
      styles: {
        yourTextStyle: {
          font: "Helvetica",
        },
        header: {
          fontSize: 12,
        },
        tableHeader: {
          bold: true,
          color: "#fff",
        },
      },
    };

    pdfMake.fonts = {
      Roboto: {
        normal:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
        bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
        italics:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf",
        bolditalics:
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf",
      },
    };
    pdfMake.createPdf(documentDefinition).open();
  };
  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();
    const excelRows = [];
    const headers = columns
      .filter((column) => column.correspondingKey)
      .map((column) => column.key);
    excelRows.push(headers);
    rows.forEach((row) => {
      const rowData = columns
        .filter((column) => column.correspondingKey)
        .map((column) => String(row[column?.correspondingKey as keyof T]));
      excelRows.push(rowData);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, excelFileName ?? "ExportedData.xlsx");
  };

  const renderActionButtons = (row: T, actions: ActionType<T>[]) => (
    <div className=" flex flex-row my-auto h-full  gap-3 justify-center items-center ">
      {actions?.map((action, index) => {
        if (action?.isDisabled || action?.node === null) {
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
  const currentRowsContent = currentRows.map((row, rowIndex) => {
    const rowId = `row-${rowIndex}`;
    const isRowExpanded = expandedRows[rowId];
    return (
      <Fragment key={rowId}>
        <tr
          draggable={isDraggable}
          onDragStart={(e) => handleDragStart(e, row)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, row)}
          className={`${
            rowIndex !== currentRows.length - 1 && !isRowExpanded
              ? "border-b "
              : ""
          } ${rowClassNameFunction?.(row)}`}
        >
          {/* Expand/Collapse Control */}
          {(!isCollapsibleCheckActive ||
            (isCollapsible &&
              row?.collapsible?.collapsibleRows?.length > 0)) && (
            <td onClick={() => toggleRowExpansion(rowId)}>
              {!isCollapsibleCheckActive &&
              row?.collapsible?.collapsibleRows?.length === 0 ? (
                <td className="w-6 h-6 mx-auto p-1 "></td>
              ) : isRowExpanded ? (
                <FaChevronUp className="w-6 h-6 mx-auto p-1 cursor-pointer text-gray-500 hover:bg-gray-50 hover:rounded-full   " />
              ) : (
                <FaChevronDown className="w-6 h-6 mx-auto p-1 cursor-pointer text-gray-500 hover:bg-gray-50 hover:rounded-full  " />
              )}
            </td>
          )}
          {isCollapsibleCheckActive &&
            row?.collapsible?.collapsibleRows?.length === 0 && (
              <td className="w-6 h-6 mx-auto p-1 "></td>
            )}
          {/* front actions  */}
          {actions && isActionsAtFront && (
            <td>{renderActionButtons(row, actions)}</td>
          )}
          {rowKeys.map((rowKey, keyIndex) => {
            if (rowKey.node) {
              return (
                <td
                  key={keyIndex}
                  className={`${keyIndex === 0 ? "pl-3" : ""} py-3 min-w-20 ${
                    rowKey?.className
                  } `}
                >
                  {rowKey.node(row)}
                </td>
              );
            }
            if (
              !rowKey?.isImage &&
              (row[rowKey.key as keyof T] === undefined ||
                row[rowKey.key as keyof T] === null ||
                row[rowKey.key as keyof T] === "")
            ) {
              return (
                <td
                  key={keyIndex}
                  className={`${keyIndex === 0 ? "pl-3" : ""} py-3 min-w-20 ${
                    rowKey?.className
                  } `}
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
                (option) => option.label === String(row[rowKey.key as keyof T])
              );
              style = {
                color: matchedOption?.textColor,
                backgroundColor: matchedOption?.bgColor,
              };
              return (
                <td
                  key={keyIndex}
                  className={`${keyIndex === 0 ? "pl-3" : ""}  py-3  ${
                    rowKey?.className
                  } min-w-32 md:min-w-0 `}
                >
                  <P1
                    className="w-fit px-2 py-1 rounded-md font-semibold"
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
                } min-w-20 md:min-w-0 ${
                  columns.length === 2 && keyIndex === 1 && " text-center "
                }`}
              >
                {rowKey.isImage ? (
                  <img
                    src={(row[rowKey.key as keyof T] as string) || imageHolder}
                    alt="img"
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => {
                      setImageModalSrc(
                        (row[rowKey.key as keyof T] as string) ?? imageHolder
                      );
                      setIsImageModalOpen(true);
                    }}
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
          <td>
            {actions &&
              !(row?.isActionsDisabled ?? false) &&
              !isActionsAtFront &&
              renderActionButtons(row, actions)}
            {actions &&
              isActionsActive &&
              (row?.isActionsDisabled ?? false) && (
                <div className=" flex flex-row my-auto h-full  gap-3 justify-center items-center ">
                  <P1>{t("Constant")}</P1>
                </div>
              )}
          </td>
        </tr>
        {/* Collapsed Content */}
        {isRowExpanded && (
          <tr>
            <td
              colSpan={columns.length + (isActionsActive ? 1 : 0)}
              className="px-4 py-2 border-b transition-max-height duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isRowExpanded ? "1000px" : "0",
              }}
            >
              {row?.collapsible?.collapsibleHeader && (
                <div className="w-[96%] mx-auto mb-2 bg-gray-100 rounded-md px-4 py-[0.3rem] flex flex-row justify-between items-center">
                  <H5>{row?.collapsible?.collapsibleHeader}</H5>

                  {addCollapsible && (
                    <button
                      className={`px-2 ml-auto sm:px-3 py-[0.1rem] h-fit w-fit  ${
                        addCollapsible.className
                          ? `${addCollapsible.className}`
                          : "bg-black border-black hover:text-black"
                      } text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer mb pb-1`}
                      onClick={() => actionOnClick(addCollapsible, row)}
                    >
                      <H5>{addCollapsible.name}</H5>
                    </button>
                  )}
                </div>
              )}

              <table className="w-[96%] mx-auto">
                {/* Collapsible Column Headers */}
                <thead className="w-full">
                  <tr>
                    {row?.collapsible?.collapsibleColumns.length > 0 &&
                      row?.collapsible?.collapsibleColumns?.map(
                        (column: ColumnType<T>, index: number) => (
                          <th
                            key={index}
                            className={`text-left py-2 px-4 w-fit border-b  ${column?.className}`}
                          >
                            <h2 className="font-semibold text-sm ">
                              {column.key}
                            </h2>
                          </th>
                        )
                      )}
                  </tr>
                </thead>
                {/* Collapsible Rows */}
                <tbody>
                  {row?.collapsible?.collapsibleRows.length > 0 &&
                    row?.collapsible?.collapsibleRows?.map(
                      (collapsibleRow: T, rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row?.collapsible?.collapsibleRowKeys?.map(
                            (rowKey: RowKeyType<T>, keyIndex: number) => {
                              const cellValue = `${
                                collapsibleRow[rowKey?.key as keyof T]
                              }`;
                              if (rowKey.node) {
                                return (
                                  <td
                                    key={keyIndex}
                                    className={`${
                                      keyIndex === 0 ? "pl-3" : ""
                                    } py-3 min-w-20 ${rowKey?.className} `}
                                  >
                                    {rowKey.node(collapsibleRow)}
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={keyIndex}
                                  className={`py-2 px-4 text-sm  ${
                                    rowIndex !==
                                      row?.collapsible?.collapsibleRows.length -
                                        1 && "border-b"
                                  }`}
                                >
                                  {cellValue}
                                </td>
                              );
                            }
                          )}
                          <td
                            className={`py-2 px-4  ${
                              rowIndex !==
                                row?.collapsible?.collapsibleRows.length - 1 &&
                              "border-b"
                            }`}
                          >
                            {collapsibleActions &&
                              renderActionButtons(
                                { ...row, ...collapsibleRow }, //by this way we can access the main row data in the collapsible actions
                                collapsibleActions
                              )}
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </td>
          </tr>
        )}
      </Fragment>
    );
  });
  useEffect(() => {
    if (sortConfigKey) {
      sortRows(sortConfigKey?.key, sortConfigKey?.direction);
    }
  }, []);
  const renderFilters = (isUpper: boolean) => {
    if (!filters) {
      return null;
    }
    if (filters) {
      return filters.map(
        (filter, index) =>
          filter.isUpperSide === isUpper &&
          !filter.isDisabled && (
            <div
              key={index}
              className="flex flex-row gap-2 justify-between items-center"
            >
              {filter.label && <H5 className="w-fit">{filter.label}</H5>}
              {filter.node}
            </div>
          )
      );
    }
  };
  return (
    <div
      className={` ${
        filterPanel?.isFilterPanelActive ? "flex flex-row gap-2" : ""
      }`}
    >
      {filterPanel?.isFilterPanelActive && <FilterPanel {...filterPanel} />}
      <div
        className={`mx-auto w-full overflow-scroll no-scrollbar flex flex-col gap-4 __className_a182b8 `}
      >
        <div className=" flex flex-row gap-4 justify-between items-center ">
          {/* search button */}
          {isSearch && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                usedSetCurrentPage(1);
              }}
              placeholder={t("Search")}
              className="border border-gray-200 rounded-md py-2 px-3 w-fit focus:outline-none"
            />
          )}
          {/* outside search button */}
          {outsideSearch?.()}
          {/* filters  for upperside*/}
          <div className="flex flex-row flex-wrap gap-4 ml-auto ">
            {renderFilters(true)}
          </div>
        </div>
        <div className="flex flex-col bg-white border border-gray-100 shadow-sm rounded-lg   ">
          {/* header part */}
          <div className="flex flex-row flex-wrap  justify-between items-center gap-4  px-6 border-b border-gray-200  py-4   ">
            {title && <H4 className="mr-auto">{title}</H4>}
            <div className="ml-auto flex flex-row gap-4">
              <div className="flex flex-row flex-wrap gap-4  ">
                {isPdf && (
                  <div className="my-auto">
                    <ButtonTooltip content="Pdf">
                      <BsFilePdf
                        className="text-3xl my-auto cursor-pointer "
                        onClick={generatePDF}
                      />
                    </ButtonTooltip>
                  </div>
                )}
                {isExcel && (
                  <div className="my-auto">
                    <ButtonTooltip content="Excel">
                      <FaFileExcel
                        className="text-3xl my-auto cursor-pointer "
                        onClick={generateExcel}
                      />
                    </ButtonTooltip>
                  </div>
                )}
                {/* filters for lowerside */}
                {renderFilters(false)}
              </div>
              {/* add button */}
              {addButton && !addButton.isDisabled && (
                <button
                  className={`px-2 ml-auto sm:px-3 py-1 h-fit w-fit ${
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
          <div className="px-6 py-4 flex flex-col gap-4 overflow-scroll no-scrollbar w-full">
            <div className="border border-gray-100 rounded-md w-full overflow-auto no-scrollbar  ">
              <table className="bg-white w-full ">
                <thead className="border-b  ">
                  <tr>
                    {isCollapsible && <th></th>}
                    {columns.map((column, index) => {
                      if (column.node) {
                        return column.node();
                      }
                      return (
                        <th
                          key={index}
                          className={`${
                            columns.length === 2 && "justify-between  "
                          } ${index === 0 ? "pl-3" : ""}  py-3  min-w-8 `}
                        >
                          <H5
                            className={`w-max flex gap-2 "text-gray-600" ${
                              columns.length === 2 && index == 1 && "  mx-auto"
                            } ${column?.className} ${
                              index === columns.length - 1 &&
                              actions &&
                              isActionsActive
                                ? "mx-auto px-4"
                                : ""
                            }`}
                          >
                            <span className="flex flex-row gap-1 items-center justify-center">
                              {column?.isAddable && (
                                <GoPlusCircle
                                  onClick={() => column?.onClick?.()}
                                  className=" hover:text-blue-500 transition-transform cursor-pointer text-lg"
                                />
                              )}
                              {column.key}
                            </span>
                            <div
                              className="sort-buttons"
                              style={{ display: "inline-block" }}
                            >
                              {column?.outsideSort}
                              {column.isSortable &&
                                !column?.outsideSort &&
                                (sortConfig?.key === rowKeys[index]?.key &&
                                sortConfig?.direction === "ascending" ? (
                                  <button
                                    onClick={() =>
                                      sortRows(
                                        rowKeys[index].key as Extract<
                                          keyof T,
                                          string
                                        >,
                                        "descending"
                                      )
                                    }
                                  >
                                    ↑
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      sortRows(
                                        rowKeys[index].key as Extract<
                                          keyof T,
                                          string
                                        >,
                                        "ascending"
                                      )
                                    }
                                  >
                                    ↓
                                  </button>
                                ))}
                            </div>
                          </H5>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>{currentRowsContent}</tbody>
              </table>
            </div>
            {rows.length > 0 && isRowsPerPage && (
              <div className="w-fit ml-auto flex flex-row gap-4">
                {/* Rows per page */}
                <div className="flex flex-row gap-2 px-6 items-center">
                  <Caption>{t("Rows per page")}:</Caption>
                  <select
                    className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
                    value={usedRowsPerPage}
                    onChange={(e) => {
                      usedSetRowsPerPage(Number(e.target.value));
                      const totalNewPages = Math.ceil(
                        usedTotalRows / Number(e.target.value)
                      );
                      if (usedCurrentPage > totalNewPages) {
                        usedSetCurrentPage(Number(totalNewPages));
                      }
                    }}
                  >
                    {rowsPerPageOptions?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={RowPerPageEnum.ALL}>{t("ALL")}</option>
                  </select>
                </div>
                {/* Pagination */}
                {isPagination && (
                  <div className=" flex flex-row gap-2 items-center">
                    <Caption>
                      {Math.min(
                        (usedCurrentPage - 1) * usedRowsPerPage + 1,
                        usedTotalRows
                      )}
                      –
                      {Math.min(
                        usedCurrentPage * usedRowsPerPage,
                        usedTotalRows
                      )}{" "}
                      of {usedTotalRows}
                    </Caption>
                    <div className="flex flex-row gap-4">
                      <button
                        onClick={() => {
                          if (usedCurrentPage > 1) {
                            usedSetCurrentPage(Number(usedCurrentPage) - 1);
                          }
                        }}
                        className="cursor-pointer"
                        disabled={usedCurrentPage === 1}
                      >
                        {"<"}
                      </button>
                      <button
                        onClick={() => {
                          if (usedCurrentPage < usedTotalPages) {
                            usedSetCurrentPage(Number(usedCurrentPage) + 1);
                          }
                        }}
                        className="cursor-pointer"
                        disabled={usedCurrentPage === usedTotalPages}
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* action modal if there is */}
          {actions?.map((action, index) => {
            if (action?.isModal && action?.isModalOpen && action?.modal) {
              return <div key={index}>{action.modal}</div>;
            }
          })}
          {collapsibleActions?.map((action, index) => {
            if (action?.isModal && action?.isModalOpen && action?.modal) {
              return <div key={index}>{action.modal}</div>;
            }
          })}
          {/* addbutton modal if there is  */}
          {addButton?.isModal && addButton?.isModalOpen && addButton?.modal && (
            <div>{addButton.modal}</div>
          )}
          {/* addCollapsible modal if there is  */}
          {addCollapsible?.isModal &&
            addCollapsible?.isModalOpen &&
            addCollapsible?.modal && <div>{addCollapsible.modal}</div>}
          {/* image modal if it opens */}
          {isImageModalOpen && (
            <ImageModal
              isOpen={isImageModalOpen}
              close={() => {
                setIsImageModalOpen(false);
              }}
              img={imageModalSrc}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericTable;
