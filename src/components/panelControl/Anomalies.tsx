import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
	DateRangeKey,
	FormElementsState,
	RoleEnum,
	commonDateOptions,
} from "../../types";
import {
	Anomaly,
	AnomalySeverity,
	AnomalyType,
	useGetQueryAnomalies,
	useMarkAsReviewedMutation,
	useTriggerAnomalyCheckMutation,
} from "../../utils/api/anomaly";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

export interface AnomalyRow extends Anomaly {
  userName: string;
  formattedDetectedAt: string;
  formattedIncidentDate: string;
  typeLabel: string;
  severityLabel: string;
}

const AnomaliesPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { currentPage, setCurrentPage, rowsPerPage } = useGeneralContext();
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AnomalyRow>();
  const [isReviewConfirmationOpen, setIsReviewConfirmationOpen] =
    useState(false);
  const [isTriggerConfirmationOpen, setIsTriggerConfirmationOpen] =
    useState(false);

  const initialFilterPanelFormElements = {
    date: "thisMonth",
    after: dateRanges.thisMonth().after,
    before: dateRanges.thisMonth().before,
    user: "",
    type: "",
    severity: "",
  };

  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);

  const anomaliesData = useGetQueryAnomalies(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  const users = useGetUsersMinimal();
  const { mutate: markAsReviewed } = useMarkAsReviewedMutation();
  const { mutate: triggerCheck, isPending: isTriggering } =
    useTriggerAnomalyCheckMutation();

  const anomalyTypeOptions = useMemo(
    () => [
      {
        value: AnomalyType.RAPID_PAYMENTS,
        label: t("Rapid Payments"),
        backgroundColor: "bg-red-500",
      },
      {
        value: AnomalyType.RAPID_GAME_EXPLANATIONS,
        label: t("Rapid Game Explanations"),
        backgroundColor: "bg-orange-500",
      },
    ],
    [t]
  );

  const anomalySeverityOptions = useMemo(
    () => [
      {
        value: AnomalySeverity.LOW,
        label: t("Low"),
        backgroundColor: "bg-green-500",
      },
      {
        value: AnomalySeverity.MEDIUM,
        label: t("Medium"),
        backgroundColor: "bg-yellow-500",
      },
      {
        value: AnomalySeverity.HIGH,
        label: t("High"),
        backgroundColor: "bg-orange-500",
      },
      {
        value: AnomalySeverity.CRITICAL,
        label: t("Critical"),
        backgroundColor: "bg-red-500",
      },
    ],
    [t]
  );

  const rows = useMemo(() => {
    if (!anomaliesData?.data) return [];

    try {
      return anomaliesData.data.map((anomaly: Anomaly) => {
        const foundUser = getItem(anomaly.user, users);
        
        // Handle date conversion safely
        let detectedDate: Date;
        let incidentDate: Date;
        
        try {
          const detectedAtDate = anomaly.detectedAt instanceof Date 
            ? anomaly.detectedAt 
            : new Date(anomaly.detectedAt);
          const incidentDateObj = anomaly.incidentDate instanceof Date 
            ? anomaly.incidentDate 
            : new Date(anomaly.incidentDate);
          
          const zonedDetectedAt = toZonedTime(detectedAtDate, "UTC");
          const zonedIncidentDate = toZonedTime(incidentDateObj, "UTC");
          detectedDate = new Date(zonedDetectedAt);
          incidentDate = new Date(zonedIncidentDate);
        } catch (error) {
          console.error("Error parsing dates:", error);
          detectedDate = new Date();
          incidentDate = new Date();
        }

        const typeOption = anomalyTypeOptions.find(
          (opt) => opt.value === anomaly.type
        );
        const severityOption = anomalySeverityOptions.find(
          (opt) => opt.value === anomaly.severity
        );

        return {
          ...anomaly,
          userName: foundUser?.name || anomaly.user,
          formattedDetectedAt: format(detectedDate, "yyyy-MM-dd HH:mm"),
          formattedIncidentDate: format(incidentDate, "yyyy-MM-dd HH:mm"),
          typeLabel: typeOption?.label || anomaly.type,
          severityLabel: severityOption?.label || anomaly.severity,
        };
      });
    } catch (error) {
      console.error("Error processing anomalies:", error);
      return [];
    }
  }, [anomaliesData, users, anomalyTypeOptions, anomalySeverityOptions]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true },
      { key: t("Type"), isSortable: true },
      { key: t("Severity"), isSortable: true },
      { key: t("Description"), isSortable: false },
      { key: t("Detected At"), isSortable: true },
      { key: t("Incident Date"), isSortable: true },
      { key: t("Status"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userName" },
      {
        key: "typeLabel",
        node: (row: AnomalyRow) => {
          const typeOption = anomalyTypeOptions.find(
            (opt) => opt.value === row.type
          );
          return (
            <span
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${typeOption?.backgroundColor} text-white`}
            >
              {row.typeLabel}
            </span>
          );
        },
      },
      {
        key: "severityLabel",
        node: (row: AnomalyRow) => {
          const severityOption = anomalySeverityOptions.find(
            (opt) => opt.value === row.severity
          );
          return (
            <span
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${severityOption?.backgroundColor} text-white`}
            >
              {row.severityLabel}
            </span>
          );
        },
      },
      {
        key: "description",
        node: (row: AnomalyRow) => (
          <div className="max-w-md truncate" title={row.description}>
            {row.description}
          </div>
        ),
      },
      { key: "formattedDetectedAt" },
      { key: "formattedIncidentDate" },
      {
        key: "isReviewed",
        node: (row: AnomalyRow) => (
          <span
            className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${
              row.isReviewed
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {row.isReviewed ? t("Reviewed") : t("Pending")}
          </span>
        ),
      },
    ],
    [t, anomalyTypeOptions, anomalySeverityOptions]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterPanelFormElements({
              ...filterPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users?.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
        placeholder: t("User"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: anomalyTypeOptions,
        placeholder: t("Type"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "severity",
        label: t("Severity"),
        options: anomalySeverityOptions,
        placeholder: t("Severity"),
        required: false,
      },
    ],
    [
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
      users,
      anomalyTypeOptions,
      anomalySeverityOptions,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Mark as Reviewed"),
        icon: <FiCheck />,
        className: "text-green-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isReviewConfirmationOpen}
            close={() => setIsReviewConfirmationOpen(false)}
            confirm={() => {
              if (rowToAction && user) {
                markAsReviewed({
                  anomalyId: rowToAction._id,
                  reviewedBy: user._id,
                });
                setIsReviewConfirmationOpen(false);
              }
            }}
            title={t("Mark as Reviewed")}
            text={t("Are you sure you want to mark this anomaly as reviewed?")}
          />
        ) : null,
        isModalOpen: isReviewConfirmationOpen,
        setIsModal: setIsReviewConfirmationOpen,
        isPath: false,
        isDisabled:
          !user ||
          ![RoleEnum.MANAGER].includes(user?.role?._id) ||
          rowToAction?.isReviewed,
      },
    ],
    [
      t,
      rowToAction,
      isReviewConfirmationOpen,
      user,
      markAsReviewed,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
      {
        label: t("Trigger Check"),
        isUpperSide: true,
        node: (
          user &&
          [RoleEnum.MANAGER].includes(user?.role?._id) && (
            <button
              onClick={() => setIsTriggerConfirmationOpen(true)}
              disabled={isTriggering}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiOutlineRefresh
                className={`${isTriggering ? "animate-spin" : ""}`}
              />
              {t("Trigger Anomaly Check")}
            </button>
          )
        ),
      },
    ],
    [t, showFilters, isTriggering, user]
  );

  const pagination = useMemo(() => {
    return anomaliesData
      ? {
          totalPages: anomaliesData.totalPages,
          totalRows: anomaliesData.totalNumber,
        }
      : null;
  }, [anomaliesData]);

  // Reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto">
        <ConfirmationDialog
          isOpen={isTriggerConfirmationOpen}
          close={() => setIsTriggerConfirmationOpen(false)}
          confirm={() => {
            triggerCheck();
            setIsTriggerConfirmationOpen(false);
          }}
          title={t("Trigger Anomaly Check")}
          text={t(
            "Are you sure you want to manually trigger an anomaly check? This will scan recent activities for anomalies."
          )}
        />
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Anomalies")}
          isActionsActive={true}
          filters={filters}
          filterPanel={filterPanel}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default AnomaliesPage;

