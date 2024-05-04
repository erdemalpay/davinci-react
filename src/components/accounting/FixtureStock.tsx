import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountFixture,
  AccountFixtureStock,
  AccountStockLocation,
} from "../../types";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import {
  useAccountFixtureStockMutations,
  useGetAccountFixtureStocks,
} from "../../utils/api/account/fixtureStock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import {
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
  const fixtures = useGetAccountFixtures();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountFixtureStock>();
  const { setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      fixture: "",
      location: "",
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
        fxtr: (stock.fixture as AccountFixture).name,
        lctn: (stock.location as AccountStockLocation).name,
        unitPrice: (stock.fixture as AccountFixture)?.unitPrice,
        totalPrice: parseFloat(
          (
            ((stock.fixture as AccountFixture).unitPrice ?? 0) * stock.quantity
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
  const inputs = [
    FixtureInput({
      fixtures: fixtures,
    }),
    StockLocationInput({ locations: locations }),
    QuantityInput(),
  ];
  const filterPanelInputs = [
    FixtureInput({ fixtures: fixtures, required: true }),
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
      node: (row: any) => (
        <div className={!isEnableEdit ? "text-center" : ""}>
          {row.totalPrice} ₺
        </div>
      ),
    },
  ];
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
            (rowToAction.fixture as AccountFixture).name
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
          fixture: (row.fixture as AccountFixture)._id,
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
              fixture: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.fixture as AccountFixture
              )?._id,
              location: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.location as AccountStockLocation
              )?._id,
              quantity: stocks.find((stock) => stock._id === rowToAction._id)
                ?.quantity,
              unitPrice: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.fixture as AccountFixture
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
    setRows(
      stocks
        .filter((stock) => {
          return (
            passesFilter(
              filterPanelFormElements.fixture,
              (stock.fixture as AccountFixture)?._id
            ) &&
            passesFilter(
              filterPanelFormElements.location,
              (stock.location as AccountStockLocation)?._id
            )
          );
        })
        .map((stock) => {
          return {
            ...stock,
            fxtr: (stock.fixture as AccountFixture).name,
            lctn: (stock.location as AccountStockLocation).name,
            unitPrice: (stock.fixture as AccountFixture)?.unitPrice,
            totalPrice: parseFloat(
              (
                ((stock.fixture as AccountFixture).unitPrice ?? 0) *
                stock.quantity
              ).toFixed(1)
            ),
          };
        })
    );
    setCurrentPage(1);
    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements]);
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
          columns={
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Fixture Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
        />
      </div>
    </>
  );
};

export default FixtureStock;
