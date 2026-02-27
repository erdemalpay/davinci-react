import { Tooltip } from "@material-tailwind/react";
import "pdfmake/build/pdfmake";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFilePdf } from "react-icons/bs";
import { CgChevronDownR, CgChevronUpR } from "react-icons/cg";
import { FaFileExcel } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { PiFadersHorizontal } from "react-icons/pi";
import { RiFilter3Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useGeneralContext } from "../../../context/General.context";
import { FormElementsState, RowPerPageEnum } from "../../../types";
import {
  OutsideSearchProps,
  outsideSearch,
} from "../../../utils/outsideSearch";
import { outsideSort } from "../../../utils/outsideSort";
import { GenericButton } from "../../common/GenericButton";
import ImageModal from "../Modals/ImageModal";
import { OrientationToggle } from "../TabPanel/OrientationToggle";
import { useTabPanelContext } from "../TabPanel/UnifiedTabPanel";
import { Caption, H4, H5, P1 } from "../Typography";
import {
  ActionType,
  ColumnType,
  FilterType,
  PanelFilterType,
  RowKeyType,
} from "../shared/types";
import ButtonTooltip from "./ButtonTooltip";
import ColumnActiveModal from "./ColumnActiveModal";
import FilterPanel from "./FilterPanel";
import CustomTooltip from "./Tooltip";
import "./table.css";

type PaginationProps = {
  totalPages: number;
  totalRows: number;
};
type OutsideSortProps = {
  filterPanelFormElements: FormElementsState;
  setFilterPanelFormElements: (state: FormElementsState) => void;
};

type Props<T> = {
  rows: any[];
  isDraggable?: boolean;
  onDragEnter?: (DraggedRow: T, TargetRow: T) => void;
  isActionsActive: boolean;
  columns: ColumnType[];
  isCollapsible?: boolean;
  rowKeys: RowKeyType<T>[];
  searchRowKeys?: RowKeyType<T>[];
  actions?: ActionType<T>[];
  isPdf?: boolean;
  collapsibleActions?: ActionType<T>[];
  title?: string;
  addButton?: ActionType<T>;
  addCollapsible?: ActionType<T>;
  filterPanel?: PanelFilterType;
  isColumnFilter?: boolean;
  imageHolder?: string;
  tooltipLimit?: number;
  rowsPerPageOptions?: number[];
  isAllRowPerPageOption?: boolean;
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
  outsideSortProps?: OutsideSortProps;
  outsideSearchProps?: OutsideSearchProps;
  selectionActions?: ActionType<T>[];
  isToolTipEnabled?: boolean;
  isEmtpyExcel?: boolean;
  clickableCell?: boolean;
  // Toggle, GenericTable sayfalarında search yanında gözükmeli
  // Eğer prop verilmezse, UnifiedTabPanel context'inden alınır
  showOrientationToggle?: boolean;
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
  isColumnFilter = true,
  collapsibleActions,
  onDragEnter,
  outsideSortProps,
  outsideSearchProps,
  isSearch = true,
  isPdf = false,
  isExcel = false,
  isCollapsible = false,
  isToolTipEnabled = false,
  clickableCell = false,
  isPagination = true,
  isRowsPerPage = true,
  isActionsAtFront = false,
  isCollapsibleCheckActive = true,
  isEmtpyExcel = false,
  isAllRowPerPageOption = true,
  searchRowKeys,
  tooltipLimit = 40,
  rowClassNameFunction,
  excelFileName,
  rowsPerPageOptions = [
    RowPerPageEnum.FIRST,
    RowPerPageEnum.SECOND,
    RowPerPageEnum.THIRD,
  ],
  pagination,
  selectionActions,
  showOrientationToggle,
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
    tableColumns,
    setTableColumns,
    selectedRows,
    setSelectedRows,
    isSelectionActive,
    setIsSelectionActive,
    tabOrientation,
    setTabOrientation,
  } = useGeneralContext();
  const { allowOrientationToggle } = useTabPanelContext();
  const navigate = useNavigate();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState("");
  const [isColumnActiveModalOpen, setIsColumnActiveModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showHeaderLeftButton, setShowHeaderLeftButton] = useState(false);
  const [showHeaderRightButton, setShowHeaderRightButton] = useState(false);
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [expandedCells, setExpandedCells] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (!title) return;
    const existing = tableColumns[title];
    if (!existing || existing.length !== columns.length) {
      setTableColumns((prev) => ({
        ...prev,
        [title]: columns.map((column) => ({ ...column, isActive: true })),
      }));
    }
  }, [title, columns, setTableColumns, tableColumns]);

  useEffect(() => {
    if (sortConfigKey) {
      setSortConfig({
        key: sortConfigKey.key,
        direction: sortConfigKey.direction,
      });
    }
  }, [sortConfigKey]);

  const checkHeaderScrollButtons = () => {
    if (headerScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = headerScrollRef.current;
      setShowHeaderLeftButton(scrollLeft > 10);
      setShowHeaderRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollHeaderToDirection = (direction: "left" | "right") => {
    if (headerScrollRef.current) {
      const scrollAmount = 200;
      headerScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const usedColumns = title
    ? tableColumns[title]?.filter((column) => column.isActive)
    : columns;

  const usedRowKeys = title
    ? rowKeys.filter(
        (_rk, index) =>
          tableColumns[title]?.[isActionsAtFront ? index + 1 : index]?.isActive
      )
    : rowKeys;

  const baseRows = rows ?? [];

  const filteredRows = useMemo(() => {
    if (!isSearch) return baseRows;
    const keys = searchRowKeys ?? usedRowKeys;
    const q = searchQuery.trimStart().toLocaleLowerCase("tr-TR");
    if (!q) return baseRows;
    return baseRows.filter((row) =>
      keys.some((rowKey) => {
        const value = row[rowKey.key as keyof typeof row];
        if (typeof value === "string")
          return value.toLocaleLowerCase("tr-TR").includes(q);
        if (typeof value === "number") return value.toString().includes(q);
        if (typeof value === "boolean")
          return (value ? "true" : "false").includes(q);
        return false;
      })
    );
  }, [baseRows, isSearch, searchQuery, searchRowKeys, usedRowKeys]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    const { key, direction } = sortConfig;
    return [...filteredRows].sort((a, b) => {
      const isSortable = (a["isSortable"] ?? true) && (b["isSortable"] ?? true);
      if (!isSortable) return 0;
      const aNum = Number(a[key]);
      const bNum = Number(b[key]);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);
      const valA = isNumeric ? aNum : String(a[key] ?? "").toLowerCase();
      const valB = isNumeric ? bNum : String(b[key] ?? "").toLowerCase();
      if (valA < valB) return direction === "ascending" ? -1 : 1;
      if (valA > valB) return direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const usedTotalRows = pagination ? pagination.totalRows : sortedRows.length;
  const totalPages = Math.ceil(usedTotalRows / rowsPerPage);
  const usedTotalPages = pagination ? pagination.totalPages : totalPages;

  const currentRows = useMemo(() => {
    if (!isRowsPerPage || pagination) return sortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    return sortedRows.slice(start, end);
  }, [sortedRows, isRowsPerPage, pagination, currentPage, rowsPerPage]);

  const sortRows = (key: string, direction: "ascending" | "descending") => {
    setSortConfig({ key, direction });
    setSortConfigKey({ key, direction });
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
    if (onDragEnter) onDragEnter(draggedRow, targetRow);
    setExpandedRows({});
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [rowId]: !prevExpandedRows[rowId],
    }));
  };

  const toggleCellExpansion = (cellId: string) => {
    setExpandedCells((prevExpandedCells) => ({
      ...prevExpandedCells,
      [cellId]: !prevExpandedCells[cellId],
    }));
  };

  const actionOnClick = (action: ActionType<T>, row: T) => {
    if (action.setRow) action.setRow(row);
    if (action.onClick) action.onClick(row);
    if (action?.isModal && action.setIsModal) {
      if (isSelectionActive) {
        if (selectedRows.length === 0) {
          toast.error(
            t("Please select at least one row to perform this action.")
          );
          return;
        }
      }
      action?.setIsModal(true);
    } else if (action.isPath && action.path) {
      navigate(action.path);
    }
  };

  const generatePDF = () => {
    const pdfMake = (window as any).pdfMake;
    const data: any[] = [];
    data.push(
      usedColumns
        .filter((column) => column.correspondingKey)
        ?.map((column) => ({
          text: column.key,
          style: "tableHeader",
        }))
    );
    sortedRows.forEach((row) => {
      const rowData: any[] = [];
      usedColumns?.forEach((column) => {
        if (column.correspondingKey) {
          const value = String(row[column.correspondingKey]);
          rowData.push(value);
        }
      });
      data.push([...rowData]);
    });
    const documentDefinition = {
      content: [
        {
          table: { headerRows: 1, body: data },
          layout: {
            fillColor: (rowIndex: number) =>
              rowIndex === 0
                ? "#000080"
                : rowIndex % 2 === 0
                ? "#d8d2d2"
                : "#ffffff",
          },
        },
      ],
      styles: {
        yourTextStyle: { font: "Helvetica" },
        header: { fontSize: 12 },
        tableHeader: { bold: true, color: "#fff" },
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
    const excelRows: any[] = [];
    const headers = usedColumns
      .filter((column) => column.correspondingKey)
      .map((column) => column.key);
    excelRows.push(headers);
    const excelAllRows = !isEmtpyExcel ? sortedRows : [];
    excelAllRows.forEach((row) => {
      const rowData = usedColumns
        .filter((column) => column.correspondingKey)
        .map((column) => {
          const value = row[column.correspondingKey as keyof T];
          if (value === undefined || value === null) return "";
          if (typeof value === "number") return value;
          return String(value);
        });
      excelRows.push(rowData);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, excelFileName ?? "ExportedData.xlsx");
  };

  const renderActionButtons = (row: T, actions: ActionType<T>[]) => (
    <div className="flex flex-row my-auto h-full gap-3 justify-center items-center">
      {actions?.map((action, index) => {
        if (action?.isDisabled || action?.node === null) return null;
        if (action.node) return <div key={index}>{action.node(row)}</div>;
        return (
          <div
            key={index}
            className={`${
              action.icon &&
              "rounded-full  h-6 w-6 flex my-auto items-center justify-center"
            } ${action?.className}`}
            onClick={() => actionOnClick(action, row)}
          >
            {action.icon && (
              <ButtonTooltip content={action.name}>{action.icon}</ButtonTooltip>
            )}
            {action.isButton && (
              <GenericButton className={action?.buttonClassName}>
                {action.name}
              </GenericButton>
            )}
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
          }  ${rowClassNameFunction?.(row) ?? ""}`}
        >
          {selectionActions && isSelectionActive && (
            <td className="w-6 h-6 mx-auto p-1 ">
              {selectedRows.includes(row) ? (
                <MdOutlineCheckBox
                  className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
                  onClick={() => {
                    setSelectedRows(
                      selectedRows.filter((selectedRow) => selectedRow !== row)
                    );
                  }}
                />
              ) : (
                <MdOutlineCheckBoxOutlineBlank
                  className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
                  onClick={() => {
                    setSelectedRows([...selectedRows, row]);
                  }}
                />
              )}
            </td>
          )}
          {(!isCollapsibleCheckActive ||
            (isCollapsible &&
              row?.collapsible?.collapsibleRows?.length > 0)) && (
            <td onClick={() => toggleRowExpansion(rowId)}>
              {isRowExpanded ? (
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
          {actions && isActionsAtFront && isActionsActive && (
            <td>{renderActionButtons(row, actions)}</td>
          )}
          {usedRowKeys?.map((rowKey, keyIndex) => {
            const columnIndex = isActionsAtFront ? keyIndex + 1 : keyIndex;
            const column = usedColumns?.[columnIndex];
            const columnClassName = column?.columnClassName ?? "";
            if (rowKey.node) {
              return (
                <td
                  key={keyIndex}
                  className={`${keyIndex === 0 ? "pl-3" : ""} py-3 min-w-20 ${
                    rowKey?.className
                  } ${columnClassName}`}
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
                  } ${columnClassName}`}
                >
                  -
                </td>
              );
            }
            if (rowKey.isParseFloat) {
              const formattedValue = parseFloat(
                row[rowKey.key as keyof T] as string
              )
                .toFixed(2)
                .replace(/\.?0*$/, "");
              return (
                <td
                  key={keyIndex}
                  className={`${keyIndex === 0 ? "pl-3" : ""} py-3 min-w-20 ${
                    rowKey?.className
                  } ${columnClassName}`}
                >
                  <P1>{formattedValue} ₺</P1>
                </td>
              );
            }
            const cellValue = `${row[rowKey.key as keyof T]}`;
            const displayValue =
              cellValue.length > tooltipLimit &&
              (isToolTipEnabled || clickableCell)
                ? `${cellValue.substring(0, tooltipLimit)}...`
                : cellValue;
            let style: React.CSSProperties = {};
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
                  } ${columnClassName} min-w-32 md:min-w-0 `}
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
            const cellId = `${rowIndex}-${keyIndex}`;
            const isCellExpanded = expandedCells[cellId];
            return (
              <td
                key={keyIndex}
                className={`${keyIndex === 0 ? "pl-3" : ""} py-3 ${
                  rowKey?.className
                } ${columnClassName} ${
                  cellValue.length > tooltipLimit && clickableCell
                    ? "max-w-xs"
                    : "min-w-20 md:min-w-0"
                } `}
              >
                {rowKey.isImage ? (
                  <img
                    src={(row[rowKey.key as keyof T] as string) || imageHolder}
                    alt="img"
                    className="w-12 h-12 rounded-full cursor-pointer min-w-12"
                    onClick={() => {
                      setImageModalSrc(
                        (row[rowKey.key as keyof T] as string) ?? imageHolder
                      );
                      setIsImageModalOpen(true);
                    }}
                  />
                ) : cellValue.length > tooltipLimit && clickableCell ? (
                  <div
                    className="cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() => toggleCellExpansion(cellId)}
                  >
                    <P1 className="whitespace-pre-wrap break-words w-full">
                      {isCellExpanded ? cellValue : displayValue}
                    </P1>
                  </div>
                ) : cellValue.length > tooltipLimit && isToolTipEnabled ? (
                  <CustomTooltip content={cellValue}>
                    <P1>{displayValue}</P1>
                  </CustomTooltip>
                ) : (
                  <P1 style={style}>{displayValue}</P1>
                )}
              </td>
            );
          })}
          <td>
            {actions &&
              isActionsActive &&
              !(row?.isSortable === false) &&
              !(row?.isActionsDisabled ?? false) &&
              !isActionsAtFront &&
              renderActionButtons(row, actions)}
            {actions &&
              isActionsActive &&
              (row?.isActionsDisabled ?? false) && (
                <div className="flex flex-row my-auto h-full gap-3 items-center">
                  <P1>{t("Constant")}</P1>
                </div>
              )}
          </td>
        </tr>
        {isRowExpanded && (
          <tr>
            <td
              colSpan={usedColumns?.length + (isActionsActive ? 1 : 0)}
              className="px-4 py-2 border-b transition-max-height duration-300 ease-in-out overflow-hidden"
              style={{ maxHeight: isRowExpanded ? "1000px" : "0" }}
            >
              {row?.collapsible?.collapsibleHeader && (
                <div className="w-[96%] mx-auto mb-2 bg-gray-100 rounded-md px-4 py-[0.3rem] flex flex-row justify-between items-center">
                  <H5>{row?.collapsible?.collapsibleHeader}</H5>
                  {addCollapsible && (
                    <GenericButton
                      variant="black"
                      size="sm"
                      className={`ml-auto ${addCollapsible.className || ""}`}
                      onClick={() => actionOnClick(addCollapsible, row)}
                    >
                      <H5>{addCollapsible.name}</H5>
                    </GenericButton>
                  )}
                </div>
              )}
              <table className="w-[96%] mx-auto">
                <thead className="w-full">
                  <tr>
                    {row?.collapsible?.collapsibleColumns.length > 0 &&
                      row?.collapsible?.collapsibleColumns?.map(
                        (column: ColumnType, index: number) => (
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
                <tbody>
                  {row?.collapsible?.collapsibleRows.length > 0 &&
                    row?.collapsible?.collapsibleRows?.map(
                      (collapsibleRow: T, rowIndex: number) => (
                        <tr
                          key={rowIndex}
                          className={`${row?.collapsible?.className?.(
                            row?.collapsible?.collapsibleRows[rowIndex]
                          )} `}
                        >
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
                                    } py-3 min-w-20 ${
                                      rowKey?.className
                                    } border-b`}
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
                          {collapsibleActions && isActionsActive && (
                            <td
                              className={`py-2 px-4  ${
                                rowIndex !==
                                  row?.collapsible?.collapsibleRows.length -
                                    1 && "border-b"
                              }`}
                            >
                              {renderActionButtons(
                                { ...row, ...collapsibleRow },
                                collapsibleActions
                              )}
                            </td>
                          )}
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
    checkHeaderScrollButtons();
    const container = headerScrollRef.current;
    if (container) {
      container.addEventListener("scroll", checkHeaderScrollButtons);
      window.addEventListener("resize", checkHeaderScrollButtons);
      return () => {
        container.removeEventListener("scroll", checkHeaderScrollButtons);
        window.removeEventListener("resize", checkHeaderScrollButtons);
      };
    }
  }, [usedColumns?.length]);

  const renderFilters = (isUpper: boolean) => {
    if (!filters) return null;
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
  };

  const allVisibleSelected =
    selectedRows.length > 0 &&
    selectedRows.length === currentRows.length &&
    currentRows.every((r) => selectedRows.includes(r));

  return (
    <div
      className={`${
        filterPanel?.isFilterPanelActive ? "flex flex-row gap-2" : ""
      }`}
    >
      {filterPanel?.isFilterPanelActive && <FilterPanel {...filterPanel} />}
      <div
        className={`mx-auto w-full overflow-scroll no-scrollbar flex flex-col gap-4 __className_a182b8 `}
      >
        <div className=" flex flex-row gap-4 justify-between items-center ">
          <div className="flex flex-row gap-2 items-center">
            {isSearch && (
              <div className="relative w-fit">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("Search")}
                  className="border border-gray-200 rounded-md py-2 px-3 pr-8 focus:outline-none"
                />
                {searchQuery && (
                  <GenericButton
                    onClick={() => setSearchQuery("")}
                    variant="clear"
                    aria-label="Clear search"
                  >
                    ×
                  </GenericButton>
                )}
              </div>
            )}
            {outsideSearchProps && outsideSearch(outsideSearchProps)}
            {(showOrientationToggle ?? allowOrientationToggle) && (
              <div className="hidden sm:flex">
                <OrientationToggle
                  orientation={tabOrientation}
                  onChange={setTabOrientation}
                />
              </div>
            )}
          </div>
          {!(selectionActions && isSelectionActive) && (
            <div className="flex flex-row flex-wrap gap-4 ml-auto">
              {renderFilters(true)}
            </div>
          )}
        </div>
        <div className="flex flex-col bg-white border border-gray-100 shadow-sm rounded-lg   ">
          <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-6 border-b border-gray-200 py-3 sm:py-4">
            <div className="flex flex-row gap-1 items-center w-full sm:w-auto">
              {selectionActions && (
                <Tooltip
                  content={
                    isSelectionActive
                      ? t("Close Selection")
                      : t("Activate Selection")
                  }
                  placement="top"
                >
                  <div
                    onClick={() => {
                      if (isSelectionActive) setSelectedRows([]);
                      setIsSelectionActive(!isSelectionActive);
                    }}
                  >
                    {isSelectionActive ? (
                      <CgChevronUpR className="my-auto text-xl cursor-pointer hover:scale-105" />
                    ) : (
                      <CgChevronDownR className="my-auto text-xl cursor-pointer hover:scale-105" />
                    )}
                  </div>
                </Tooltip>
              )}
              {title && (
                <H4 className="mr-auto text-base sm:text-lg">{title}</H4>
              )}
            </div>
            {selectionActions &&
              isSelectionActive &&
              isActionsActive &&
              selectedRows.length > 0 &&
              renderActionButtons({} as unknown as T, selectionActions)}
            <div className="flex flex-row flex-wrap gap-2 sm:gap-4 relative items-center w-full sm:w-auto sm:ml-auto justify-end">
              {!(selectionActions && isSelectionActive) && (
                <>
                  {/* Alt filters (Total vs) */}
                  {renderFilters(false)}
                  {/* PDF Button */}
                  {isPdf && (
                    <div
                      className="my-auto items-center text-lg sm:text-xl cursor-pointer border p-1.5 sm:p-2 rounded-md hover:bg-blue-50 bg-opacity-50 hover:scale-105"
                      onClick={generatePDF}
                    >
                      <BsFilePdf />
                    </div>
                  )}
                  {/* Excel Button - mobilde de göster */}
                  {isExcel && (
                    <div
                      className="my-auto items-center text-lg sm:text-xl cursor-pointer border px-1.5 py-1 sm:px-2 sm:py-1 rounded-md hover:bg-blue-50 bg-opacity-50 hover:scale-105"
                      onClick={generateExcel}
                    >
                      <ButtonTooltip content={"Excel"}>
                        <FaFileExcel />
                      </ButtonTooltip>
                    </div>
                  )}
                  {/* Mobile Filter Button - dropdown style */}
                  {filters &&
                    filters.some((f) => f.isUpperSide && !f.isDisabled) && (
                      <>
                        <Tooltip content={t("Filters")} placement="top">
                          <div
                            onClick={() =>
                              setIsFilterModalOpen((prev) => !prev)
                            }
                            className="items-center my-auto text-lg sm:text-xl cursor-pointer border p-1.5 sm:p-2 rounded-md hover:bg-blue-50 bg-opacity-50 hover:scale-105 sm:hidden"
                          >
                            <RiFilter3Line />
                          </div>
                        </Tooltip>
                        {isFilterModalOpen && (
                          <div className="absolute top-10 right-0 flex flex-col gap-2 bg-white rounded-md py-4 px-2 max-w-fit border-t border-gray-200 drop-shadow-lg z-50 min-w-64 sm:hidden">
                            {filters
                              .filter(
                                (filter) =>
                                  filter.isUpperSide && !filter.isDisabled
                              )
                              .map((filter, index) => (
                                <div
                                  key={index}
                                  className="flex flex-row justify-between items-center gap-4 pb-3 border-b border-gray-100 last:border-b-0"
                                >
                                  {filter.label && (
                                    <H5 className="text-sm font-semibold text-gray-700">
                                      {filter.label}
                                    </H5>
                                  )}
                                  <div className="flex items-center">
                                    {filter.node}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  {/* Column Filter Button */}
                  {isColumnFilter && (
                    <>
                      <Tooltip content={t("Filter Columns")} placement="top">
                        <div
                          onClick={() =>
                            setIsColumnActiveModalOpen((prev) => !prev)
                          }
                          className="items-center my-auto text-lg sm:text-xl cursor-pointer border p-1.5 sm:p-2 rounded-md hover:bg-blue-50 bg-opacity-50 hover:scale-105"
                        >
                          <PiFadersHorizontal />
                        </div>
                      </Tooltip>
                      {isColumnActiveModalOpen && title && (
                        <div className="absolute top-10 right-0 flex flex-col gap-2 bg-white rounded-md py-4 px-2 max-w-fit border-t border-gray-200  drop-shadow-lg z-50 min-w-64">
                          <ColumnActiveModal title={title} />
                        </div>
                      )}
                    </>
                  )}
                  {/* Add Button - mobilde yeni satırda */}
                  {addButton && !addButton.isDisabled && (
                    <GenericButton
                      variant="black"
                      size="sm"
                      className={`${
                        addButton.className || ""
                      } text-sm w-full sm:w-auto order-last sm:order-none`}
                      onClick={() =>
                        actionOnClick(addButton, {} as unknown as T)
                      }
                    >
                      <H5 className="text-xs sm:text-sm whitespace-nowrap">
                        {addButton.name}
                      </H5>
                    </GenericButton>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-4 flex flex-col gap-4 overflow-scroll no-scrollbar w-full  ">
            <div className="border border-gray-100 rounded-md w-full min-h-60 relative">
              {showHeaderLeftButton && (
                <button
                  onClick={() => scrollHeaderToDirection("left")}
                  className="absolute left-1 top-6 -translate-y-1/2 z-30 w-10 h-10 md:w-10 md:h-10 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-full flex items-center justify-center hover:bg-white hover:border-blue-400 hover:shadow-md transition-all duration-300 hover:scale-105 shadow-sm touch-manipulation"
                  aria-label="Scroll left"
                >
                  <FiChevronLeft className="text-gray-400 text-lg md:text-xl hover:text-blue-600 transition-colors" />
                </button>
              )}
              {showHeaderRightButton && (
                <button
                  onClick={() => scrollHeaderToDirection("right")}
                  className="absolute right-1 top-6 -translate-y-1/2 z-30 w-10 h-10 md:w-10 md:h-10 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-full flex items-center justify-center hover:bg-white hover:border-blue-400 hover:shadow-md transition-all duration-300 hover:scale-105 shadow-sm touch-manipulation"
                  aria-label="Scroll right"
                >
                  <FiChevronRight className="text-gray-400 text-lg md:text-xl hover:text-blue-600 transition-colors" />
                </button>
              )}
              <div
                ref={headerScrollRef}
                className={`overflow-auto scroll-smooth relative cursor-grab active:cursor-grabbing ${
                  rowsPerPage > 50 || rowsPerPage === RowPerPageEnum.ALL
                    ? "h-[600px]"
                    : "max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh]"
                }`}
              >
                <table className="bg-white w-full">
                  <thead className="border-b bg-gray-100">
                    <tr>
                      {selectionActions && isSelectionActive && (
                        <th className="sticky top-0 z-10 bg-gray-100 shadow-sm">
                          {selectionActions && isSelectionActive && (
                            <Tooltip content={t("Select All")} placement="top">
                              <div
                                onClick={() => {
                                  if (allVisibleSelected) {
                                    setSelectedRows([]);
                                  } else {
                                    setSelectedRows(currentRows);
                                  }
                                }}
                              >
                                {allVisibleSelected ? (
                                  <MdOutlineCheckBox className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105" />
                                ) : (
                                  <MdOutlineCheckBoxOutlineBlank className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105" />
                                )}
                              </div>
                            </Tooltip>
                          )}
                        </th>
                      )}
                      {isCollapsible && (
                        <th className="sticky top-0 z-10 bg-gray-100"></th>
                      )}
                      {usedColumns?.map((column, index) => {
                        if (column.node)
                          return column.node(column.columnClassName ?? "");
                        return (
                          <th
                            key={index}
                            className={`sticky top-0 z-10 bg-gray-100 shadow-sm ${
                              index === 0 &&
                              !isCollapsible &&
                              !isSelectionActive
                                ? "pl-3"
                                : ""
                            }  py-3  min-w-8 ${column.columnClassName ?? ""} `}
                          >
                            <h1
                              className={`text-base font-medium leading-6 w-max flex gap-2  ${
                                column?.className
                              }  ${
                                index === usedColumns?.length - 1 &&
                                actions &&
                                isActionsActive
                                  ? "mx-auto px-4"
                                  : ""
                              }`}
                            >
                              <span
                                className={`flex flex-row gap-1 items-center justify-center `}
                              >
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
                                {outsideSortProps &&
                                  column?.correspondingKey &&
                                  outsideSort(
                                    column.correspondingKey,
                                    outsideSortProps.filterPanelFormElements,
                                    outsideSortProps.setFilterPanelFormElements
                                  )}
                                {column.isSortable &&
                                  (!outsideSortProps ||
                                    !column?.correspondingKey) &&
                                  (sortConfig?.key ===
                                    usedRowKeys[index]?.key &&
                                  sortConfig?.direction === "ascending" ? (
                                    <GenericButton
                                      variant="icon"
                                      size="sm"
                                      className="p-0"
                                      onClick={() =>
                                        sortRows(
                                          usedRowKeys[index].key as Extract<
                                            keyof T,
                                            string
                                          >,
                                          "descending"
                                        )
                                      }
                                    >
                                      ↑
                                    </GenericButton>
                                  ) : (
                                    <GenericButton
                                      variant="icon"
                                      size="sm"
                                      className="p-0"
                                      onClick={() =>
                                        sortRows(
                                          usedRowKeys[index].key as Extract<
                                            keyof T,
                                            string
                                          >,
                                          "ascending"
                                        )
                                      }
                                    >
                                      ↓
                                    </GenericButton>
                                  ))}
                              </div>
                            </h1>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>{currentRowsContent}</tbody>
                </table>
              </div>
            </div>
            {rows.length > 0 && isRowsPerPage && (
              <div className="w-full sm:w-fit ml-auto flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 sm:gap-4 px-4 sm:px-6">
                {/* Mobile: first row – Rows per page */}
                <div className="flex flex-row gap-2 items-center w-full sm:w-auto justify-end">
                  <Caption className="text-xs sm:text-inherit">
                    {t("Rows per page")}:
                  </Caption>
                  <select
                    className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer min-h-8"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      const totalNewPages = Math.ceil(
                        usedTotalRows / Number(e.target.value)
                      );
                      if (currentPage > totalNewPages) {
                        setCurrentPage(Number(totalNewPages));
                      }
                    }}
                  >
                    {rowsPerPageOptions?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                    {isAllRowPerPageOption && (
                      <option value={RowPerPageEnum.ALL}>{t("ALL")}</option>
                    )}
                  </select>
                </div>
                {/* Mobile: second row – Range text + prev/next */}
                {isPagination && (
                  <div className="flex flex-row gap-2 sm:gap-4 items-center w-full sm:w-auto justify-end">
                    <Caption className="text-xs sm:text-inherit whitespace-nowrap">
                      {Math.min(
                        (currentPage - 1) * rowsPerPage + 1,
                        usedTotalRows
                      )}
                      –{Math.min(currentPage * rowsPerPage, usedTotalRows)}{" "}
                      {"of"} {usedTotalRows}
                    </Caption>
                    <div className="flex flex-row gap-1">
                      <GenericButton
                        onClick={() => {
                          if (currentPage > 1) {
                            setCurrentPage(Number(currentPage) - 1);
                            setExpandedRows({});
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === 1}
                        aria-label={t("Previous page")}
                        className="min-w-8 h-8 p-0 shrink-0"
                      >
                        {"<"}
                      </GenericButton>
                      <GenericButton
                        onClick={() => {
                          if (currentPage < usedTotalPages) {
                            setCurrentPage(Number(currentPage) + 1);
                            setExpandedRows({});
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === usedTotalPages}
                        aria-label={t("Next page")}
                        className="min-w-8 h-8 p-0 shrink-0"
                      >
                        {">"}
                      </GenericButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {actions?.map((action, index) => {
            if (action?.isModal && action?.isModalOpen && action?.modal) {
              return <div key={index}>{action.modal}</div>;
            }
          })}
          {selectionActions?.map((action, index) => {
            if (action?.isModal && action?.isModalOpen && action?.modal) {
              return <div key={index}>{action.modal}</div>;
            }
          })}
          {collapsibleActions?.map((action, index) => {
            if (action?.isModal && action?.isModalOpen && action?.modal) {
              return <div key={index}>{action.modal}</div>;
            }
          })}
          {addButton?.isModal && addButton?.isModalOpen && addButton?.modal && (
            <div>{addButton.modal}</div>
          )}
          {addCollapsible?.isModal &&
            addCollapsible?.isModalOpen &&
            addCollapsible?.modal && <div>{addCollapsible.modal}</div>}
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
