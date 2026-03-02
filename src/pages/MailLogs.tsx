import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { FormElementsState } from "../types";
import {
  MailLog,
  MailLogStatus,
  MailType,
  useGetQueryMailLogs,
} from "../utils/api/mail";
import { formatAsLocalDate } from "../utils/format";

type CollapsibleRow = {
  collapsibleColumns: { key: string; isSortable: boolean }[];
  collapsibleRows: { metadata: Record<string, unknown> }[];
  collapsibleRowKeys: {
    key: string;
    node: (row: MailLogRow) => React.ReactNode;
  }[];
};

type MailLogRow = MailLog & {
  formattedSentAt: string;
  formattedDeliveredAt: string;
  formattedOpenedAt: string;
  formattedClickedAt: string;
  collapsible: CollapsibleRow;
};

const mailLogStatusOptions = [
  {
    value: MailLogStatus.SENT,
    label: "Sent",
    backgroundColor: "bg-blue-500",
  },
  {
    value: MailLogStatus.DELIVERED,
    label: "Delivered",
    backgroundColor: "bg-green-500",
  },
  {
    value: MailLogStatus.BOUNCED,
    label: "Bounced",
    backgroundColor: "bg-red-500",
  },
  {
    value: MailLogStatus.COMPLAINED,
    label: "Complained",
    backgroundColor: "bg-orange-500",
  },
  {
    value: MailLogStatus.FAILED,
    label: "Failed",
    backgroundColor: "bg-gray-500",
  },
];

const mailTypeOptions = [
  {
    value: MailType.BACK_IN_STOCK,
    label: "Back in Stock",
    backgroundColor: "bg-blue-500",
  },
];

const MailLogs = () => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      email: "",
      status: "",
      mailType: "",
      after: "",
      before: "",
      sort: "",
      search: "",
      asc: 1,
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const mailLogsPayload = useGetQueryMailLogs(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  const rows = useMemo(() => {
    const allRows =
      mailLogsPayload?.data?.map((log: MailLog) => ({
        ...log,
        formattedSentAt: log.sentAt
          ? formatAsLocalDate(format(log.sentAt, "yyyy-MM-dd"))
          : "-",
        formattedDeliveredAt: log.deliveredAt
          ? formatAsLocalDate(format(log.deliveredAt, "yyyy-MM-dd"))
          : "-",
        formattedOpenedAt: log.openedAt
          ? formatAsLocalDate(format(log.openedAt, "yyyy-MM-dd"))
          : "-",
        formattedClickedAt: log.clickedAt
          ? formatAsLocalDate(format(log.clickedAt, "yyyy-MM-dd"))
          : "-",
        collapsible: {
          collapsibleColumns: [{ key: t("Metadata"), isSortable: false }],
          collapsibleRows: log?.metadata
            ? [
                {
                  metadata: log.metadata,
                },
              ]
            : [],
          collapsibleRowKeys: [
            {
              key: "metadata",
              node: (row: MailLogRow) => {
                return <pre>{JSON.stringify(row?.metadata, null, 2)}</pre>;
              },
            },
          ],
        },
      })) ?? [];

    return allRows;
  }, [mailLogsPayload, t]);

  const columns = useMemo(
    () => [
      { key: t("Email"), isSortable: true },
      { key: t("Subject"), isSortable: true },
      { key: t("Mail Type"), isSortable: true },
      { key: t("Status"), isSortable: true },
      { key: t("Sent At"), isSortable: true },
      { key: t("Delivered At"), isSortable: true },
      { key: t("Opened At"), isSortable: true },
      { key: t("Clicked At"), isSortable: true },
      { key: t("Error Message"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "email",
        className: "min-w-48",
      },
      {
        key: "subject",
        className: "min-w-48",
      },
      {
        key: "mailType",
        className: "min-w-32 pr-1",
        node: (row: MailLogRow) => {
          const mailType = mailTypeOptions.find(
            (item) => item.value === row.mailType
          );
          if (!mailType) return null;
          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${mailType?.backgroundColor} text-white`}
            >
              {t(mailType?.label)}
            </div>
          );
        },
      },
      {
        key: "status",
        className: "min-w-32 pr-1",
        node: (row: MailLogRow) => {
          const status = mailLogStatusOptions.find(
            (item) => item.value === row.status
          );
          if (!status) return null;
          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${status?.backgroundColor} text-white`}
            >
              {t(status?.label)}
            </div>
          );
        },
      },
      {
        key: "formattedSentAt",
        className: "min-w-32",
      },
      {
        key: "formattedDeliveredAt",
        className: "min-w-32",
      },
      {
        key: "formattedOpenedAt",
        className: "min-w-32",
      },
      {
        key: "formattedClickedAt",
        className: "min-w-32",
      },
      {
        key: "errorMessage",
        className: "min-w-48",
        node: (row: MailLogRow) => {
          return row.errorMessage ? (
            <span className="text-red-600 text-sm">{row.errorMessage}</span>
          ) : (
            "-"
          );
        },
      },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "email",
        label: t("Email"),
        placeholder: t("Email"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: mailLogStatusOptions.map((status) => ({
          value: status.value,
          label: t(status.label),
        })),
        placeholder: t("Status"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "mailType",
        label: t("Mail Type"),
        options: mailTypeOptions.map((type) => ({
          value: type.value,
          label: t(type.label),
        })),
        placeholder: t("Mail Type"),
        required: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: false,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: false,
        isDatePicker: true,
      },
    ],
    [t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements]);

  const outsideSortProps = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return mailLogsPayload
      ? {
          totalPages: mailLogsPayload.totalPages,
          totalRows: mailLogsPayload.totalNumber,
        }
      : null;
  }, [mailLogsPayload]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          outsideSearchProps={outsideSearchProps}
          isSearch={false}
          title={t("Mail Logs")}
          filterPanel={filterPanel}
          filters={filters}
          isActionsActive={false}
          isCollapsible={true}
          outsideSortProps={outsideSortProps}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>
    </>
  );
};

export default MailLogs;
