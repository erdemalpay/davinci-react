import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountService, RoleEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import {
  ExpenseTypeInput,
  NameInput,
  VendorInput,
} from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";

type FormElementsState = {
  [key: string]: any;
};
const Service = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const services = useGetAccountServices();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountService>();
  const [showFilters, setShowFilters] = useState(false);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      vendor: "",
      expenseType: "",
      name: "",
    });
  const [inputForm, setInputForm] = useState({
    vendor: [],
    expenseType: [],
    name: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountService, deleteAccountService, updateAccountService } =
    useAccountServiceMutations();
  const [rows, setRows] = useState(services);

  const filterPanelInputs = [
    VendorInput({ vendors: vendors }),
    ExpenseTypeInput({ expenseTypes: expenseTypes }),
  ];
  const inputs = [
    NameInput(),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountService) => (
        <p
          className={`${
            user &&
            [
              RoleEnum.MANAGER,
              RoleEnum.CATERINGMANAGER,
              RoleEnum.GAMEMANAGER,
            ].includes(user?.role?._id) &&
            "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          }`}
          onClick={() => {
            if (
              user &&
              ![
                RoleEnum.MANAGER,
                RoleEnum.CATERINGMANAGER,
                RoleEnum.GAMEMANAGER,
              ].includes(user?.role?._id)
            )
              return;
            setCurrentPage(1);
            // setRowsPerPage(RowPerPageEnum.FIRST);
            setSearchQuery("");
            setSortConfigKey(null);
            navigate(`/service/${row?._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
    {
      key: "expenseType",
      className: "min-w-32",
      node: (row: AccountService) => {
        return row.expenseType.map((expType: string, index) => {
          const foundExpenseType = expenseTypes.find(
            (expenseType) => expenseType._id === expType
          );
          return (
            <span
              key={row._id + "expenseType" + index}
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold`}
              style={{ backgroundColor: foundExpenseType?.backgroundColor }}
            >
              {foundExpenseType?.name}
            </span>
          );
        });
      },
    },
    {
      key: "vendor",
      className: "min-w-32",
      node: (row: AccountService) => {
        if (row.vendor) {
          return row?.vendor?.map((vendor: string, index) => {
            const foundVendor = vendors.find((vn) => vn._id === vendor);
            if (!foundVendor)
              return <div key={row._id + "vendor" + index}>-</div>;
            return (
              <span
                key={row._id + "vendor" + index}
                className={`text-sm mr-1  w-fit`}
              >
                {foundVendor?.name}
                {(row?.vendor?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          });
        }
      },
    },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        );
      },
    },
  ];
  if (
    user &&
    ![
      RoleEnum.MANAGER,
      RoleEnum.CATERINGMANAGER,
      RoleEnum.GAMEMANAGER,
    ].includes(user?.role?._id)
  ) {
    columns.splice(
      columns.findIndex((column) => column.key === "Unit Price"),
      1
    );
    columns.splice(
      columns.findIndex((column) => column.key === "Actions"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "unitPrice"),
      1
    );
  }
  const addButton = {
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
          createAccountService({
            ...inputForm,
          });
          setInputForm({
            vendor: [],
            expenseType: [],
            name: "",
          });
        }}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const actions = [
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
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
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
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          setForm={setInputForm}
          constantValues={{
            name: rowToAction.name,
            expenseType: rowToAction.expenseType,
            vendor: rowToAction.vendor,
          }}
          handleUpdate={() => {
            updateAccountService({
              id: rowToAction?._id,
              updates: {
                ...inputForm,
              },
            });
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(
      services
        .filter((service) => {
          return (
            (filterPanelFormElements.vendor === "" ||
              service.vendor?.includes(filterPanelFormElements.vendor)) &&
            (filterPanelFormElements.expenseType === "" ||
              service.expenseType?.includes(
                filterPanelFormElements.expenseType
              ))
          );
        })
        .map((service) => {
          return {
            ...service,
          };
        })
    );
    if (Object.values(filterPanelFormElements).some((value) => value !== "")) {
      setCurrentPage(1);
    }
    setTableKey((prev) => prev + 1);
  }, [services, filterPanelFormElements]);

  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Services")}
          addButton={addButton}
          filters={filters}
          filterPanel={filterPanel}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default Service;
