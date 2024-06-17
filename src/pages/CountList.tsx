import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import ButtonFilter from "../components/panelComponents/common/ButtonFilter";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import {
  AccountCountList,
  AccountStockLocation,
  RoleEnum,
  User,
} from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStockLocations } from "../utils/api/account/stockLocation";
import { StockLocationInput } from "../utils/panelInputs";

interface LocationEntries {
  [key: string]: boolean;
}

const CountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { countListId } = useParams();
  const { user } = useUserContext();
  const locations = useGetAccountStockLocations();
  const countLists = useGetAccountCountLists();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [selectedCountList, setSelectedCountList] =
    useState<AccountCountList>();
  const [isCountLocationModalOpen, setIsCountLocationModalOpen] =
    useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<CountListRowType>();
  const { createAccountCount } = useAccountCountMutations();
  const products = useGetAccountProducts();
  const [form, setForm] = useState({
    product: [],
  });
  const countListOption = countLists?.map((p) => {
    return {
      value: p._id,
      label: p.name,
    };
  });
  type CountListRowType = {
    product: string;
  };
  const currentCountList = countLists?.find((item) => item._id === countListId);
  if (!currentCountList) {
    return <></>;
  }
  const [countLocationForm, setCountLocationForm] = useState({
    location: "",
  });
  const counts = useGetAccountCounts();

  const countLocationInputs = [
    StockLocationInput({
      locations: locations.filter((l) =>
        countLists
          .find((row) => row._id === countListId)
          ?.locations?.includes(l._id)
      ),
    }),
  ];
  const countLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  function handleLocationUpdate(row: any, changedLocationId: string) {
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (!currentCountList) return;
    const newProducts = [
      ...(currentCountList.products?.filter(
        (p) =>
          p.product !==
          (products.find((it) => it.name === row.product)?._id ?? "")
      ) || []),

      {
        product: products.find((it) => it.name === row.product)?._id ?? "",
        locations: Object.entries(row).reduce((acc, [key, value]) => {
          if (key === "product" || typeof key !== "string") return acc;
          if (key === changedLocationId) {
            if (!value) {
              acc.push(key);
            }
          } else if (value) {
            acc.push(key);
          }
          return acc;
        }, [] as string[]),
      },
    ];

    updateAccountCountList({
      id: currentCountList._id,
      updates: { products: newProducts },
    });

    toast.success(`${t("Count List updated successfully")}`);
  }
  const rows = () => {
    let productRows = [];
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (currentCountList && currentCountList.products) {
      for (let item of currentCountList.products) {
        const product = products.find((it) => it._id === item.product);
        if (product) {
          const locationEntries = locations?.reduce<LocationEntries>(
            (acc, location) => {
              acc[location._id] =
                item.locations?.includes(location._id) ?? false;
              return acc;
            },
            {}
          );
          productRows.push({
            product: product.name,
            ...locationEntries,
          });
        }
      }
    }
    productRows = productRows.sort((a, b) => {
      if (a.product < b.product) {
        return -1;
      }
      if (a.product > b.product) {
        return 1;
      }
      return 0;
    });
    return productRows;
  };
  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter((item) => {
          const countList = countLists.find((item) => item._id === countListId);
          return !countList?.products?.some((pro) => pro.product === item._id);
        })
        .map((product) => {
          return {
            value: product._id,
            label: product.name,
          };
        }),
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [{ key: "product" }];
  locations.forEach((item) => {
    columns.push({ key: item.name, isSortable: true });
    rowKeys.push({
      key: item._id,
      node: (row: any) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row[item._id]}
            onChange={() => handleLocationUpdate(row, item._id)}
          />
        ) : row[item?._id] ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    });
  });
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }

  const addButton = {
    name: t("Add Product"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: countListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addProductInputs}
        formKeys={addProductFormKeys}
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
            const newProducts = form.product?.map((item) => ({
              product: item,
              locations:
                countLists.find((item) => item._id === countListId)
                  ?.locations ?? [],
            }));
            productRows = [...products, ...newProducts];
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
    ) : (
      ""
    ),
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
            if (countListId && rowToAction) {
              const currentCountList = countLists.find(
                (item) => item._id === countListId
              );
              const newProducts = currentCountList?.products?.filter(
                (item) =>
                  item.product !==
                  products?.find((p) => p.name === rowToAction.product)?._id
              );
              updateAccountCountList({
                id: countListId,
                updates: {
                  products: newProducts,
                },
              });
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List Item")}
          text={`${rowToAction.product} ${t("GeneralDeleteMessage")}`}
        />
      ) : (
        ""
      ),
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("Count")}
          onclick={() => {
            setIsCountLocationModalOpen(true);
          }}
        />
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
        : true,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [countLists, products, countListId]);

  // adjust columns and rowkeys  according to locations deletes if neccessary
  locations.forEach((location) => {
    if (
      !countLists
        .find((item) => item._id === countListId)
        ?.locations.includes(location._id)
    ) {
      const columnIndex = columns.findIndex(
        (column) => column.key === location.name
      );
      if (columnIndex !== -1) {
        columns.splice(columnIndex, 1);
      }
      const rowKeyIndex = rowKeys.findIndex(
        (rKey) => rKey.key === location._id
      );
      if (rowKeyIndex !== -1) {
        rowKeys.splice(rowKeyIndex, 1);
      }
    }
  });

  if (!user) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
              options={countListOption}
              value={
                selectedCountList
                  ? {
                      value: selectedCountList._id,
                      label: selectedCountList.name,
                    }
                  : {
                      value: currentCountList._id,
                      label: currentCountList.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedCountList(
                  countLists?.find((p) => p._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/count-list/${selectedOption?.value}`);
              }}
              placeholder={t("Select a count list")}
            />
          </div>
        </div>
        <div className="w-[95%] my-5 mx-auto ">
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={rows()}
            actions={
              [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
                user.role._id
              )
                ? actions
                : undefined
            }
            addButton={
              [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
                user.role._id
              )
                ? addButton
                : undefined
            }
            filters={filters}
            title={countLists.find((row) => row._id === countListId)?.name}
            isActionsActive={isEnableEdit}
          />
          {isCountLocationModalOpen && (
            <GenericAddEditPanel
              isOpen={isCountLocationModalOpen}
              close={() => setIsCountLocationModalOpen(false)}
              inputs={countLocationInputs}
              formKeys={countLocationFormKeys}
              submitItem={() => {}}
              submitFunction={async () => {
                if (countLocationForm.location === "" || !user) return;
                if (
                  counts?.filter((item) => {
                    return (
                      item.isCompleted === false &&
                      (item.location as AccountStockLocation)._id ===
                        countLocationForm.location &&
                      (item.user as User)._id === user._id &&
                      (item.countList as AccountCountList)._id === countListId
                    );
                  }).length > 0
                ) {
                  setCurrentPage(1);
                  setSearchQuery("");
                  setSortConfigKey(null);
                  navigate(
                    `/count/${countLocationForm.location}/${countListId}`
                  );
                } else {
                  createAccountCount({
                    location: countLocationForm.location,
                    countList: countListId,
                    isCompleted: false,
                    createdAt: new Date(),
                    user: user._id,
                  });
                  setCurrentPage(1);
                  setSearchQuery("");
                  setSortConfigKey(null);
                  navigate(
                    `/count/${countLocationForm.location}/${countListId}`
                  );
                }
              }}
              setForm={setCountLocationForm}
              isEditMode={false}
              topClassName="flex flex-col gap-2 "
              buttonName={t("Submit")}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CountList;
