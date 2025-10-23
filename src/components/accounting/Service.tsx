import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { RoleEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Service = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pages = useGetPanelControlPages();
  const services = useGetAccountServices();
  const { user } = useUserContext();
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();

  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const {
    showServiceFilters,
    setShowServiceFilters,
    filterServicePanelFormElements,
    setFilterServicePanelFormElements,
  } = useFilterContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const { createAccountService, deleteAccountService, updateAccountService } =
    useAccountServiceMutations();

  const [inputForm, setInputForm] = useState({
    vendor: [] as string[],
    expenseType: [] as string[],
    name: "",
  });

  const canManage =
    !!user &&
    [
      RoleEnum.MANAGER,
      RoleEnum.GAMEMANAGER,
      RoleEnum.OPERATIONSASISTANT,
    ].includes(user?.role?._id);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        placeholder: t("Expense Type"),
        required: true,
      },
    ],
    [vendors, expenseTypes]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        isMultiple: true,
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        isMultiple: true,
        placeholder: t("Expense Type"),
        required: true,
      },
    ],
    [expenseTypes, vendors]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "expenseType", type: FormKeyTypeEnum.STRING },
      { key: "vendor", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const rows = useMemo(() => {
    return services
      ?.filter((service) => {
        if (
          filterServicePanelFormElements.vendor !== "" &&
          !service.vendor?.includes(filterServicePanelFormElements.vendor)
        )
          return false;
        if (
          filterServicePanelFormElements.expenseType !== "" &&
          !service.expenseType?.includes(
            filterServicePanelFormElements.expenseType
          )
        )
          return false;
        return true;
      })
      .map((service) => ({ ...service }));
  }, [services, filterServicePanelFormElements]);

  const columns = useMemo(() => {
    const base = [
      { key: t("Name"), isSortable: true },
      { key: t("Expense Type"), isSortable: true },
      { key: t("Vendor"), isSortable: true },
      { key: t("Unit Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ];
    if (!canManage) {
      return base.filter(
        (c) => c.key !== t("Unit Price") && c.key !== t("Actions")
      );
    }
    return base;
  }, [t, canManage]);

  const rowKeys = useMemo(() => {
    const keys = [
      {
        key: "name",
        className: "min-w-32 pr-1",
        node: (row: any) =>
          user &&
          pages &&
          pages
            ?.find((page) => page._id === "service")
            ?.permissionRoles?.includes(user.role._id) ? (
            <p
              className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/service/${row._id}`);
              }}
            >
              {row.name}
            </p>
          ) : (
            <p>{row.name}</p>
          ),
      },
      {
        key: "expenseType",
        className: "min-w-32",
        node: (row: any) =>
          row.expenseType.map((expType: string, index: number) => {
            const found = expenseTypes.find((e) => e._id === expType);
            return (
              <span
                key={row._id + "expenseType" + index}
                className="text-sm px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold"
                style={{ backgroundColor: found?.backgroundColor }}
              >
                {found?.name}
              </span>
            );
          }),
      },
      {
        key: "vendor",
        className: "min-w-32",
        node: (row: any) =>
          row.vendor?.map((vendor: string, index: number) => {
            const found = vendors.find((v) => v._id === vendor);
            if (!found) return <div key={row._id + "vendor" + index}>-</div>;
            return (
              <span
                key={row._id + "vendor" + index}
                className="text-sm mr-1 w-fit"
              >
                {found?.name}
                {(row?.vendor?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          }),
      },
      {
        key: "unitPrice",
        node: (row: any) => (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        ),
      },
    ];
    return canManage ? keys : keys.filter((k) => k.key !== "unitPrice");
  }, [
    user,
    pages,
    setCurrentPage,
    setSearchQuery,
    setSortConfigKey,
    navigate,
    expenseTypes,
    vendors,
    canManage,
  ]);

  const addButton = useMemo(
    () => ({
      name: t(`Add Service`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          setForm={setInputForm}
          submitItem={createAccountService as any}
          generalClassName="overflow-visible"
          submitFunction={() => {
            createAccountService({ ...inputForm });
            setInputForm({ vendor: [], expenseType: [], name: "" });
          }}
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: !canManage,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountService,
      inputForm,
      canManage,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              deleteAccountService(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Service")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: !canManage,
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            generalClassName="overflow-visible"
            submitItem={updateAccountService as any}
            isEditMode
            topClassName="flex flex-col gap-2"
            setForm={setInputForm}
            constantValues={{
              name: rowToAction.name,
              expenseType: rowToAction.expenseType,
              vendor: rowToAction.vendor,
            }}
            handleUpdate={() => {
              updateAccountService({
                id: rowToAction?._id,
                updates: { ...inputForm },
              });
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: !canManage,
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      updateAccountService,
      deleteAccountService,
      inputForm,
      canManage,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showServiceFilters}
            onChange={() => setShowServiceFilters(!showServiceFilters)}
          />
        ),
      },
    ],
    [t, showServiceFilters, setShowServiceFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showServiceFilters,
      inputs: filterPanelInputs,
      formElements: filterServicePanelFormElements,
      setFormElements: setFilterServicePanelFormElements,
      closeFilters: () => setShowServiceFilters(false),
    }),
    [
      showServiceFilters,
      filterPanelInputs,
      filterServicePanelFormElements,
      setFilterServicePanelFormElements,
      setShowServiceFilters,
    ]
  );

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Services")}
        addButton={addButton}
        filters={filters}
        filterPanel={filterPanel}
        isActionsActive={canManage}
      />
    </div>
  );
};

export default Service;
