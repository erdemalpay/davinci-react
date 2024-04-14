import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { AccountCountList, AccountUnit } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useConsumptStockMutation } from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5 } from "../panelComponents/Typography";

type Props = {};

const CountLists = (props: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConsumptModalOpen, setIsConsumptModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const products = useGetAccountProducts();
  const locations = useGetAccountStockLocations();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const [rowToAction, setRowToAction] = useState<AccountCountList>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountCountList,
    deleteAccountCountList,
    updateAccountCountList,
  } = useAccountCountListMutations();
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const consumptInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name + `(${(product.unit as AccountUnit).name})`,
        };
      }),
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const rowKeys = [
    {
      key: "name",
      node: (row: AccountCountList) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            navigate(`/count-list/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
      className: "min-w-32 pr-1",
    },
  ];
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Name"),
      placeholder: t("Name"),
      required: true,
    },
  ];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t(`Add Count List`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountCountList as any}
        topClassName="flex flex-col gap-2 "
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
            deleteAccountCountList(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
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
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountCountList as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];
  const filters = [
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            setIsConsumptModalOpen(true);
          }}
        >
          <H5> {t("Enter Consumption")}</H5>
        </button>
      ),
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [countLists]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={countLists}
          title={t("Count Lists")}
          filters={filters}
          addButton={addButton}
        />
        {isConsumptModalOpen && (
          <GenericAddEditPanel
            isOpen={isConsumptModalOpen}
            close={() => setIsConsumptModalOpen(false)}
            inputs={consumptInputs}
            formKeys={consumptFormKeys}
            submitItem={consumptStock as any}
            topClassName="flex flex-col gap-2 "
          />
        )}
      </div>
    </>
  );
};

export default CountLists;
