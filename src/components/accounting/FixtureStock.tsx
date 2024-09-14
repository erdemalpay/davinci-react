import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountFixtureStock, RoleEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import {
  useAccountFixtureStockMutations,
  useGetAccountFixtureStocks,
} from "../../utils/api/account/fixtureStock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { getItem } from "../../utils/getItem";
import {
  ExpenseTypeInput,
  FixtureInput,
  QuantityInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const FixtureStock = () => {
  const { t } = useTranslation();
  const stocks = useGetAccountFixtureStocks();
  const { user } = useUserContext();
  const fixtures = useGetAccountFixtures();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const expenseTypes = useGetAccountExpenseTypes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountFixtureStock>();
  const { setCurrentPage, searchQuery, setSearchQuery } = useGeneralContext();
  const [generalTotalExpense, setGeneralTotalExpense] = useState(() => {
    return stocks.reduce((acc, stock) => {
      const expense = parseFloat(
        (
          (getItem(stock?.fixture, fixtures)?.unitPrice ?? 0) * stock.quantity
        ).toFixed(1)
      );
      return acc + expense;
    }, 0);
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      fixture: [],
      location: "",
      expenseType: "",
    });
  const [form, setForm] = useState({
    fixture: "",
    location: "",
    quantity: 0,
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rows, setRows] = useState(
    stocks.map((stock) => {
      return {
        ...stock,
        fxtr: getItem(stock?.fixture, fixtures)?.name,
        lctn: getItem(stock?.location, locations)?.name,
        unitPrice: getItem(stock?.fixture, fixtures)?.unitPrice,
        totalPrice: parseFloat(
          (
            (getItem(stock?.fixture, fixtures)?.unitPrice ?? 0) * stock.quantity
          ).toFixed(1)
        ),
      };
    })
  );
  const {
    createAccountFixtureStock,
    deleteAccountFixtureStock,
    updateAccountFixtureStock,
  } = useAccountFixtureStockMutations();
  const [temporarySearch, setTemporarySearch] = useState("");

  const outsideSearch = () => {
    return (
      <div className="flex flex-row relative min-w-32">
        <input
          type="text"
          value={temporarySearch}
          onChange={(e) => {
            setTemporarySearch(e.target.value);
            if (e.target.value === "") {
              setSearchQuery(e.target.value);
            }
          }}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchQuery(temporarySearch);
            }
          }}
          placeholder={t("Search")}
          className="border border-gray-200 rounded-md py-2 px-3 w-full focus:outline-none"
        />
        <CiSearch
          className="w-9 h-full p-2 bg-blue-gray-100 text-black cursor-pointer my-auto rounded-md absolute right-0 top-1/2 transform -translate-y-1/2"
          onClick={() => {
            setSearchQuery(temporarySearch);
          }}
        />
      </div>
    );
  };
  const inputs = [
    FixtureInput({
      fixtures: fixtures,
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    QuantityInput(),
  ];
  const filterPanelInputs = [
    FixtureInput({ fixtures: fixtures, required: true, isMultiple: true }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, required: true }),
    StockLocationInput({ locations: locations }),
  ];
  const formKeys = [
    { key: "fixture", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Fixture"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    { key: "fxtr" },
    { key: "lctn" },
    { key: "quantity" },
    {
      key: "unitPrice",
      node: (row: any) => <div>{row.unitPrice} ₺</div>,
    },
    {
      key: "totalPrice",
      node: (row: any) => <div>{row.totalPrice} ₺</div>,
    },
  ];
  if (user && ![RoleEnum.MANAGER].includes(user?.role?._id)) {
    const splicedColumns = ["Unit Price", "Total Price"];
    const splicedRowKeys = ["unitPrice", "totalPrice"];
    splicedColumns.forEach((item) => {
      columns.splice(
        columns.findIndex((column) => column.key === item),
        1
      );
    });
    splicedRowKeys.forEach((item) => {
      rowKeys.splice(
        rowKeys.findIndex((rowKey) => rowKey.key === item),
        1
      );
    });
  }
  if (isEnableEdit) {
    columns.push({ key: t("Action"), isSortable: false });
  }
  const addButton = {
    name: t("Add Fixture Stock"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        setForm={setForm}
        submitItem={createAccountFixtureStock as any}
        topClassName="flex flex-col gap-2 "
        generalClassName="overflow-visible"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
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
            deleteAccountFixtureStock(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Fixture Stock")}
          text={`${
            getItem(rowToAction.fixture, fixtures)?.name
          } stock will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      setForm: setForm,
      onClick: (row: AccountFixtureStock) => {
        setForm({
          ...form,
          fixture: row.fixture,
        });
      },
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountFixtureStock as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-visible"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              fixture: stocks.find((stock) => stock._id === rowToAction._id)
                ?.fixture,
              location: stocks.find((stock) => stock._id === rowToAction._id)
                ?.location,
              quantity: stocks.find((stock) => stock._id === rowToAction._id)
                ?.quantity,
              unitPrice: getItem(
                stocks.find((stock) => stock._id === rowToAction._id)?.fixture,
                fixtures
              )?.unitPrice,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: t("Total") + " :",
      isUpperSide: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(generalTotalExpense)}{" "}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const processedRows = stocks
      .filter((stock) => {
        return (
          (!filterPanelFormElements.fixture.length ||
            filterPanelFormElements.fixture?.some((panelFixture: string) =>
              passesFilter(panelFixture, stock.fixture)
            )) &&
          getItem(stock?.fixture, fixtures)?.expenseType?.some((type) =>
            passesFilter(filterPanelFormElements.expenseType, type)
          ) &&
          passesFilter(filterPanelFormElements.location, stock.location)
        );
      })
      .map((stock) => {
        return {
          ...stock,
          fxtr: getItem(stock?.fixture, fixtures)?.name,
          lctn: getItem(stock?.location, locations)?.name,
          unitPrice: getItem(stock?.fixture, fixtures)?.unitPrice,
          totalPrice: parseFloat(
            (
              (getItem(stock?.fixture, fixtures)?.unitPrice ?? 0) *
              stock.quantity
            ).toFixed(1)
          ),
        };
      });
    const filteredRows = processedRows.filter((row) =>
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
    const newGeneralTotalExpense = filteredRows.reduce((acc, stock) => {
      const expense = parseFloat(
        (
          (getItem(stock?.fixture, fixtures)?.unitPrice ?? 0) * stock.quantity
        ).toFixed(1)
      );
      return acc + expense;
    }, 0);
    setRows(filteredRows);
    setGeneralTotalExpense(newGeneralTotalExpense);
    if (
      searchQuery !== "" ||
      Object.values(filterPanelFormElements).some((value) => value !== "")
    ) {
      setCurrentPage(1);
    }
    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements, searchQuery, locations, fixtures]);
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
          actions={isEnableEdit ? actions : []}
          filters={filters}
          columns={columns}
          rows={rows}
          title={t("Fixture Stocks")}
          addButton={addButton}
          outsideSearch={outsideSearch}
          isSearch={false}
          filterPanel={filterPanel}
          isActionsActive={isEnableEdit}
        />
      </div>
    </>
  );
};

export default FixtureStock;
