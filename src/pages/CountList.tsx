import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { P1 } from "../components/panelComponents/Typography";
import { AccountCountList, AccountProduct, AccountUnit } from "../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";

const CountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { countListId } = useParams();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const products = useGetAccountProducts();
  const [form, setForm] = useState({
    product: "",
  });
  const countListOptions = countLists?.map((countList) => {
    return {
      value: countList._id,
      label: countList.name,
    };
  });
  const [selectedOption, setSelectedOption] = useState<AccountCountList>();
  const rows = () => {
    let productRows = [];
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (currentCountList && currentCountList.products) {
      for (let productId of currentCountList.products) {
        const product = products.find((product) => product._id === productId);
        if (product) {
          productRows.push(product);
        }
      }
    }
    return productRows;
  };
  const addInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter((product) => {
          const countList = countLists.find((item) => item._id === countListId);
          return !countList?.products?.includes(product._id);
        })
        .map((product) => {
          return {
            value: product._id,
            label: product.name + `(${(product.unit as AccountUnit).name})`,
          };
        }),
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "name" },
    {
      key: "unit",
      node: (row: AccountProduct) => <P1>{(row.unit as AccountUnit)?.name}</P1>,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [countLists, products, countListId]);

  const addButton = {
    name: t("Add Product"),
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: countListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addInputs}
        formKeys={addFormKeys}
        submitItem={updateAccountCountList as any}
        isEditMode={true}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const countListProducts = () => {
            let productRows = [];
            const products =
              countLists.find((item) => item._id === countListId)?.products ||
              [];
            productRows = [...products, form.product];
            return productRows;
          };
          updateAccountCountList({
            id: countListId,
            updates: {
              products: countListProducts(),
            },
          });
        }}
      />
    ) : null,
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,

    isPath: false,
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
            if (countListId) {
              updateAccountCountList({
                id: countListId,
                updates: {
                  products: countLists
                    .find((item) => item._id === countListId)
                    ?.products?.filter(
                      (product) => product !== rowToAction._id
                    ),
                },
              });
            }

            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List Item")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto">
        <div className="sm:w-1/4 ">
          <SelectInput
            options={countListOptions}
            value={
              selectedOption
                ? {
                    value: selectedOption._id,
                    label: selectedOption.name,
                  }
                : {
                    value:
                      countLists.find((l) => l._id === countListId)?._id ?? "",
                    label:
                      countLists.find((l) => l._id === countListId)?.name ?? "",
                  }
            }
            onChange={(selectedOption) => {
              setSelectedOption(
                countLists?.find(
                  (option) => option._id === selectedOption?.value
                )
              );
              navigate(`/count-list/${selectedOption?.value}`);
            }}
            placeholder={t("Select a count list")}
          />
        </div>
      </div>
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows()}
          actions={actions}
          addButton={addButton}
          title={countLists.find((row) => row._id === countListId)?.name}
        />
      </div>
    </>
  );
};

export default CountList;
