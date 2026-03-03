import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import {
  MailSubscription,
  MailType,
  SubscriptionStatus,
  useGetQueryMailSubscriptions,
} from "../utils/api/mail";
import { formatAsLocalDate } from "../utils/format";

type FormElementsState = {
  [key: string]: any;
};

type MailSubscriptionRow = MailSubscription & {
  formattedSubscribedAt: string;
  formattedUnsubscribedAt: string;
  subscribedTypesDisplay: string;
};

const subscriptionStatusOptions = [
  {
    value: SubscriptionStatus.ACTIVE,
    label: "Active",
    backgroundColor: "bg-green-500",
  },
  {
    value: SubscriptionStatus.UNSUBSCRIBED,
    label: "Unsubscribed",
    backgroundColor: "bg-yellow-500",
  },
  {
    value: SubscriptionStatus.BOUNCED,
    label: "Bounced",
    backgroundColor: "bg-red-500",
  },
  {
    value: SubscriptionStatus.COMPLAINED,
    label: "Complained",
    backgroundColor: "bg-orange-500",
  },
];

const mailTypeOptions = [
  {
    value: MailType.BACK_IN_STOCK,
    label: "Back in Stock",
    backgroundColor: "bg-blue-500",
  },
];

const MailSubscriptions = () => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      status: "",
      subscribedType: "",
      after: "",
      before: "",
      sort: "",
      search: "",
      asc: 1,
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const mailSubscriptionsPayload = useGetQueryMailSubscriptions(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  const rows = useMemo(() => {
    const allRows =
      mailSubscriptionsPayload?.data?.map((subscription) => ({
        ...subscription,
        formattedSubscribedAt: subscription.subscribedAt
          ? formatAsLocalDate(format(subscription.subscribedAt, "yyyy-MM-dd"))
          : "-",
        formattedUnsubscribedAt: subscription.unsubscribedAt
          ? formatAsLocalDate(format(subscription.unsubscribedAt, "yyyy-MM-dd"))
          : "-",
        subscribedTypesDisplay: subscription.subscribedTypes.join(", "),
      })) ?? [];

    return allRows;
  }, [mailSubscriptionsPayload]);

  const columns = useMemo(
    () => [
      { key: t("Email"), isSortable: true },
      { key: t("Status"), isSortable: true },
      { key: t("Subscribed Types"), isSortable: false },
      { key: t("Subscribed At"), isSortable: true },
      { key: t("Unsubscribed At"), isSortable: true },
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
        key: "status",
        className: "min-w-32 pr-1",
        node: (row: MailSubscriptionRow) => {
          const status = subscriptionStatusOptions.find(
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
        key: "subscribedTypesDisplay",
        className: "min-w-48 pr-1",
        node: (row: MailSubscriptionRow) => {
          return (
            <div className="flex flex-wrap gap-2">
              {row.subscribedTypes.map((type) => {
                const mailType = mailTypeOptions.find(
                  (item) => item.value === type
                );
                if (!mailType) return null;
                return (
                  <div
                    key={type}
                    className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${mailType?.backgroundColor} text-white`}
                  >
                    {t(mailType?.label)}
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "formattedSubscribedAt",
        className: "min-w-32",
      },
      {
        key: "formattedUnsubscribedAt",
        className: "min-w-32",
      },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: subscriptionStatusOptions.map((status) => ({
          value: status.value,
          label: t(status.label),
        })),
        placeholder: t("Status"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "subscribedType",
        label: t("Subscribed Type"),
        options: mailTypeOptions.map((type) => ({
          value: type.value,
          label: t(type.label),
        })),
        placeholder: t("Subscribed Type"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
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
    return mailSubscriptionsPayload
      ? {
          totalPages: mailSubscriptionsPayload.totalPages,
          totalRows: mailSubscriptionsPayload.totalNumber,
        }
      : null;
  }, [mailSubscriptionsPayload]);

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
          title={t("Mail Subscriptions")}
          filterPanel={filterPanel}
          filters={filters}
          isActionsActive={false}
          outsideSortProps={outsideSortProps}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>
    </>
  );
};

export default MailSubscriptions;
