import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EducationUpdateHistoryDto } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import PageNavigator from "../panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";

type Props = {
  updateHistory: EducationUpdateHistoryDto[];
  setIsUpdateHistoryOpen: (value: boolean) => void;
};

type ChangeType = "Added" | "Updated" | "Removed";

type SubItem = {
  subHeader?: string;
  paragraph?: string;
  imageUrl?: string;
  componentType?: string;
  order?: number;
};

type Subheaders = {
  before?: SubItem[];
  after?: SubItem[];
};

type EducationUpdateEntry = {
  subheaders?: Subheaders;
};

type ChangeRow = {
  type: ChangeType | string;
  field: string;
  before?: string;
  after?: string;
  imageUrlBefore?: string;
  imageUrlAfter?: string;
  componentTypeBefore?: string;
  componentTypeAfter?: string;
  orderBefore?: number;
  orderAfter?: number;
  changedKeys?: string[];
};

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null;

const safeParse = (val: unknown): unknown => {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (isObject(val)) return val;
  try {
    if (typeof val === "string") return JSON.parse(val);
    return val;
  } catch {
    return val;
  }
};

const toArray = <T,>(val: unknown): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  return [val as T];
};

const buildChangeRows = (entries: EducationUpdateEntry[]): ChangeRow[] => {
  const changeRows: ChangeRow[] = [];
  entries.forEach((entry) => {
    const sub = entry?.subheaders;
    const beforeArr = (toArray<SubItem>(safeParse(sub?.before)) ||
      []) as SubItem[];
    const afterArr = (toArray<SubItem>(safeParse(sub?.after)) ||
      []) as SubItem[];

    const maxLen = Math.max(beforeArr.length || 0, afterArr.length || 0);
    for (let i = 0; i < maxLen; i++) {
      const b = beforeArr[i];
      const a = afterArr[i];
      const field = a?.subHeader || b?.subHeader || "Subheader";

      if (b && !a) {
        changeRows.push({
          type: "Removed",
          field,
          before: b?.paragraph || "",
          imageUrlBefore: b?.imageUrl,
          componentTypeBefore: b?.componentType,
          orderBefore: b?.order,
          changedKeys: ["removed"],
        });
        continue;
      }

      if (!b && a) {
        changeRows.push({
          type: "Added",
          field,
          after: a?.paragraph || "",
          imageUrlAfter: a?.imageUrl,
          componentTypeAfter: a?.componentType,
          orderAfter: a?.order,
          changedKeys: ["added"],
        });
        continue;
      }

      if (b && a) {
        const changedKeys: string[] = [];
        const paragraphChanged = (b?.paragraph ?? "") !== (a?.paragraph ?? "");
        const imageChanged = (b?.imageUrl ?? "") !== (a?.imageUrl ?? "");
        const componentChanged =
          (b?.componentType ?? "") !== (a?.componentType ?? "");
        const orderChanged = (b?.order ?? "") !== (a?.order ?? "");

        if (paragraphChanged) changedKeys.push("paragraph");
        if (imageChanged) changedKeys.push("imageUrl");
        if (componentChanged) changedKeys.push("componentType");
        if (orderChanged) changedKeys.push("order");

        if (changedKeys.length > 0) {
          changeRows.push({
            type: "Updated",
            field,
            before: b?.paragraph || "",
            after: a?.paragraph || "",
            imageUrlBefore: b?.imageUrl,
            imageUrlAfter: a?.imageUrl,
            componentTypeBefore: b?.componentType,
            componentTypeAfter: a?.componentType,
            orderBefore: b?.order,
            orderAfter: a?.order,
            changedKeys,
          });
        }
      }
    }
  });
  return changeRows;
};

const UpdateHistory = ({ updateHistory, setIsUpdateHistoryOpen }: Props) => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);

  type CollapsibleConfig = {
    collapsibleHeader: string;
    collapsibleColumns: { key: string }[];
    collapsibleRows: ChangeRow[];
    collapsibleRowKeys: {
      key: string;
      node: (row: ChangeRow) => JSX.Element;
    }[];
    className: () => string;
  };

  type MappedRow = EducationUpdateHistoryDto & {
    userName?: string;
    formattedDate: string;
    addedCount: number;
    updatedCount: number;
    removedCount: number;
    collapsible: CollapsibleConfig;
  };

  const allRows = useMemo(() => {
    return updateHistory.map((history) => {
      const parsedUnknown = safeParse(history.updates);
      const entries = toArray<EducationUpdateEntry>(parsedUnknown);
      const changeRows = buildChangeRows(entries);

      const addedCount = changeRows.filter((c) => c.type === "Added").length;
      const updatedCount = changeRows.filter(
        (c) => c.type === "Updated"
      ).length;
      const removedCount = changeRows.filter(
        (c) => c.type === "Removed"
      ).length;

      return {
        ...history,
        userName: getItem(history.user, users)?.name,
        formattedDate: format(history.updatedAt, "dd-MM-yyyy"),
        addedCount,
        updatedCount,
        removedCount,
        collapsible: {
          collapsibleHeader: "",
          collapsibleColumns: [{ key: t("Details") }],
          collapsibleRows: changeRows,
          collapsibleRowKeys: [
            {
              key: "details",
              node: (row: ChangeRow) => (
                <div className="w-full">
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.type === "Added"
                            ? "bg-green-600 text-white"
                            : row.type === "Removed"
                            ? "bg-red-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {t(row.type)}
                      </span>
                      <span className="text-sm font-medium">{row.field}</span>
                      <div className="flex flex-wrap gap-1">
                        {row.changedKeys?.includes("imageUrl") && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {t("image")}
                          </span>
                        )}
                        {row.changedKeys?.includes("componentType") && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                            {t("component")}
                          </span>
                        )}
                        {row.changedKeys?.includes("order") && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            {t("order")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-md border p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-2">
                          {t("Before")}
                        </div>
                        {row.imageUrlBefore && (
                          <img
                            src={row.imageUrlBefore}
                            alt="before"
                            className="w-36 h-24 object-cover rounded mb-2"
                          />
                        )}
                        {row.componentTypeBefore && (
                          <div className="text-[10px] text-gray-500 mb-1">
                            {t("componentType")}: {row.componentTypeBefore}
                          </div>
                        )}
                        {row.changedKeys?.includes("order") &&
                          typeof row.orderBefore === "number" && (
                            <div className="text-[10px] text-gray-500 mb-1">
                              {t("order")}: {row.orderBefore}
                            </div>
                          )}
                        {row.before && (
                          <P1 className="text-sm text-gray-800 whitespace-pre-wrap">
                            {row.before}
                          </P1>
                        )}
                        {!row.before && !row.imageUrlBefore && (
                          <span className="text-xs text-gray-400">
                            {t("Empty")}
                          </span>
                        )}
                      </div>
                      <div className="bg-white rounded-md border p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-2">
                          {t("After")}
                        </div>
                        {row.imageUrlAfter && (
                          <img
                            src={row.imageUrlAfter}
                            alt="after"
                            className="w-36 h-24 object-cover rounded mb-2"
                          />
                        )}
                        {row.componentTypeAfter && (
                          <div className="text-[10px] text-gray-500 mb-1">
                            {t("componentType")}: {row.componentTypeAfter}
                          </div>
                        )}
                        {row.changedKeys?.includes("order") &&
                          typeof row.orderAfter === "number" && (
                            <div className="text-[10px] text-gray-500 mb-1">
                              {t("order")}: {row.orderAfter}
                            </div>
                          )}
                        {row.after && (
                          <P1 className="text-sm text-gray-800 whitespace-pre-wrap">
                            {row.after}
                          </P1>
                        )}
                        {!row.after && !row.imageUrlAfter && (
                          <span className="text-xs text-gray-400">
                            {t("Empty")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
          ],
          className: () => "",
        },
      };
    });
  }, [updateHistory, users]);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Updates"), isSortable: false },
  ];
  const Badge = ({
    color,
    children,
  }: {
    color: string;
    children: React.ReactNode;
  }) => (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color} text-white`}
    >
      {children}
    </span>
  );

  const rowKeys = [
    { key: "formattedDate" },
    { key: "userName" },
    {
      key: "summary",
      node: (row: MappedRow) => {
        return (
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center">
            <Tooltip
              content={`${t("Added")}: ${row.addedCount}`}
              placement="top"
            >
              <span className="inline-flex">
                <Badge color="bg-green-600">+ {row.addedCount}</Badge>
              </span>
            </Tooltip>
            <Tooltip
              content={`${t("Updated")}: ${row.updatedCount}`}
              placement="top"
            >
              <span className="inline-flex">
                <Badge color="bg-amber-600">~ {row.updatedCount}</Badge>
              </span>
            </Tooltip>
            <Tooltip
              content={`${t("Removed")}: ${row.removedCount}`}
              placement="top"
            >
              <span className="inline-flex">
                <Badge color="bg-red-600">- {row.removedCount}</Badge>
              </span>
            </Tooltip>
          </div>
        );
      },
    },
  ];
  const pageNavigations = [
    {
      name: t("Education"),
      path: "",
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setIsUpdateHistoryOpen(false);
      },
    },
    {
      name: t("Update History"),
      path: "",
      canBeClicked: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [updateHistory, users]);
  return (
    <>
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto mt-4">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Update History")}
          isActionsActive={false}
          isToolTipEnabled={true}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default UpdateHistory;
