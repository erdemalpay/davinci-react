import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountFixture, RoleEnum } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountFixtureMutations,
  useGetAccountFixtures,
} from "../../utils/api/account/fixture";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import {
  BrandInput,
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
const Fixture = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fixtures = useGetAccountFixtures();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountFixture>();
  const [showFilters, setShowFilters] = useState(false);
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      brand: "",
      vendor: "",
      expenseType: "",
      name: "",
    });
  const [inputForm, setInputForm] = useState({
    brand: [],
    vendor: [],
    expenseType: [],
    name: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountFixture, deleteAccountFixture, updateAccountFixture } =
    useAccountFixtureMutations();
  const [rows, setRows] = useState(fixtures);

  const filterPanelInputs = [
    BrandInput({ brands: brands }),
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
    BrandInput({ brands: brands, isMultiple: true }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Brand"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountFixture) => (
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
            navigate(`/fixture/${row?._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
    {
      key: "expenseType",
      className: "min-w-32",
      node: (row: AccountFixture) => {
        return row?.expenseType.map((expType: string, index) => {
          const foundExpenseType = expenseTypes?.find(
            (expenseType) => expenseType._id === expType
          );
          return (
            <span
              key={foundExpenseType?.name ?? "expenseType" + index + row._id}
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold`}
              style={{ backgroundColor: foundExpenseType?.backgroundColor }}
            >
              {foundExpenseType?.name ?? "-"}
            </span>
          );
        });
      },
    },
    {
      key: "brand",
      className: "min-w-32",
      node: (row: AccountFixture) => {
        if (row.brand) {
          return row?.brand?.map((brand: string, index) => {
            const foundBrand = brands?.find((br) => br._id === brand);
            return (
              <span
                key={row?._id + "brand" + index}
                className={`text-sm   mr-1  w-fit`}
              >
                {foundBrand?.name ?? "-"}
                {(row?.brand?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          });
        }
      },
    },
    {
      key: "vendor",
      className: "min-w-32",
      node: (row: AccountFixture) => {
        if (row.vendor) {
          return row?.vendor?.map((vendor: string, index) => {
            const foundVendor = vendors?.find((vn) => vn._id === vendor);
            return (
              <span
                key={row?._id + "vendor" + index}
                className={`text-sm mr-1  w-fit`}
              >
                {foundVendor?.name ?? "-"}
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
            <P1>{row?.unitPrice} ₺</P1>
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
    name: t(`Add Fixture`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        setForm={setInputForm}
        submitItem={createAccountFixture as any}
        generalClassName="overflow-visible"
        submitFunction={() => {
          createAccountFixture({
            ...inputForm,
          });
          setInputForm({
            brand: [],
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
            deleteAccountFixture(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Fixture")}
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
          submitItem={updateAccountFixture as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          setForm={setInputForm}
          constantValues={{
            name: rowToAction.name,
            expenseType: rowToAction.expenseType,
            brand: rowToAction.brand,
            vendor: rowToAction.vendor,
          }}
          handleUpdate={() => {
            updateAccountFixture({
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
      fixtures
        .filter((fixture) => {
          return (
            (filterPanelFormElements.brand === "" ||
              fixture.brand?.includes(filterPanelFormElements.brand)) &&
            (filterPanelFormElements.vendor === "" ||
              fixture.vendor?.includes(filterPanelFormElements.vendor)) &&
            (filterPanelFormElements.expenseType === "" ||
              fixture.expenseType?.includes(
                filterPanelFormElements.expenseType
              ))
          );
        })
        .map((fixture) => {
          return {
            ...fixture,
          };
        })
    );
    if (Object.values(filterPanelFormElements).some((value) => value !== "")) {
      setCurrentPage(1);
    }
    setTableKey((prev) => prev + 1);
  }, [fixtures, filterPanelFormElements]);

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
          title={t("Fixtures")}
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

export default Fixture;
