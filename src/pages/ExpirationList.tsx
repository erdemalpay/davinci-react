import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import ButtonFilter from "../components/panelComponents/common/ButtonFilter";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { ExpirationListType, ExpirationPageTabEnum, RoleEnum } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../utils/api/expiration/expirationCount";
import {
  useExpirationListMutations,
  useGetExpirationLists,
} from "../utils/api/expiration/expirationList";
import { useGetStockLocations } from "../utils/api/location";
import { getItem } from "../utils/getItem";
import { isDisabledConditionExpirationList } from "../utils/isDisabledConditions";
import { StockLocationInput } from "../utils/panelInputs";

interface LocationEntries {
  [key: string]: boolean;
}
const ExpirationList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { expirationListId } = useParams();
  const { user } = useUserContext();
  const isDisabledCondition = isDisabledConditionExpirationList(user);
  const locations = useGetStockLocations();
  const expirationLists = useGetExpirationLists();
  const { resetGeneralContext, setExpirationActiveTab } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const { createExpirationCount } = useExpirationCountMutations();
  const expirationCounts = useGetExpirationCounts();
  const { updateExpirationList } = useExpirationListMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [
    isExpirationCountLocationModalOpen,
    setIsExpirationCountLocationModalOpen,
  ] = useState(false);
  const [selectedExpirationList, setSelectedExpirationList] =
    useState<ExpirationListType>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const products = useGetAccountProducts();
  const [form, setForm] = useState({
    product: [],
  });
  const expirationListOption = expirationLists?.map((p) => {
    return {
      value: p._id,
      label: p.name,
    };
  });
  const [countLocationForm, setCountLocationForm] = useState({
    location: 0,
  });
  const countLocationInputs = [
    StockLocationInput({
      locations:
        locations?.filter((l) =>
          expirationLists
            ?.find((row) => row._id === expirationListId)
            ?.locations?.includes(l._id)
        ) ?? [],
    }),
  ];
  const countLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const currentExpirationList = expirationLists?.find(
    (item) => item._id === expirationListId
  );
  function handleLocationUpdate(row: any, changedLocationId: number) {
    if (!currentExpirationList) return;
    const currentLocations = currentExpirationList?.products?.find(
      (p) => p.product === row.productId
    )?.locations;
    const newProducts = [
      ...(currentExpirationList.products?.filter(
        (p) =>
          p.product !==
          (products?.find((it) => it.name === row.product)?._id ?? "")
      ) || []),

      {
        product: row.productId,
        locations: currentLocations
          ? currentLocations?.includes(changedLocationId)
            ? currentLocations?.filter((l) => l !== changedLocationId)
            : [...currentLocations, changedLocationId]
          : [],
      },
    ];
    if (!expirationListId) return;
    updateExpirationList({
      id: expirationListId,
      updates: { products: newProducts },
    });

    toast.success(`${t("Expiration List updated successfully")}`);
  }
  const rows = () => {
    let productRows = [];
    const currentExpirationList = expirationLists?.find(
      (item) => item._id === expirationListId
    );
    if (currentExpirationList && currentExpirationList.products) {
      for (const item of currentExpirationList.products) {
        const product = products?.find((it) => it._id === item.product);
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
            productId: product._id,
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
      options:
        products
          ?.filter((item) => {
            const expirationList = expirationLists?.find(
              (item) => item._id === expirationListId
            );
            return !expirationList?.products?.some(
              (pro) => pro.product === item._id
            );
          })
          .map((product) => {
            return {
              value: product._id,
              label: product.name,
            };
          }) ?? [],
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [{ key: "product" }];
  locations?.forEach((item) => {
    columns?.push({ key: item.name, isSortable: true });
    rowKeys?.push({
      key: String(item._id),
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
    [RoleEnum.MANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }

  const addButton = {
    name: t("Add Product"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: expirationListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addProductInputs}
        formKeys={addProductFormKeys}
        submitItem={updateExpirationList as any}
        isEditMode={true}
        buttonName={t("Add")}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const expirationListProducts = () => {
            let productRows = [];
            const products =
              expirationLists?.find((item) => item._id === expirationListId)
                ?.products || [];
            const newProducts = form.product?.map((item) => ({
              product: item,
              locations:
                expirationLists?.find((item) => item._id === expirationListId)
                  ?.locations ?? [],
            }));
            productRows = [...products, ...newProducts];
            return productRows;
          };
          updateExpirationList({
            id: expirationListId,
            updates: {
              products: expirationListProducts(),
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
            if (expirationListId && rowToAction) {
              const currentExpirationList = expirationLists?.find(
                (item) => item._id === expirationListId
              );
              const newProducts = currentExpirationList?.products?.filter(
                (item) =>
                  item.product !==
                  products?.find((p) => p.name === rowToAction.product)?._id
              );
              updateExpirationList({
                id: expirationListId,
                updates: {
                  products: newProducts,
                },
              });
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Expiration List Item")}
          text={`${rowToAction.product} ${t("GeneralDeleteMessage")}`}
        />
      ) : (
        ""
      ),
      className: "text-red-500 cursor-pointer text-2xl   ",
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
          buttonName={t("Expiration Count")}
          onclick={() => {
            setIsExpirationCountLocationModalOpen(true);
          }}
        />
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: false,
      isDisabled: isDisabledCondition,
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
  // adjust columns and rowkeys  according to locations deletes if neccessary
  locations?.forEach((location) => {
    if (
      !expirationLists
        ?.find((item) => item._id === expirationListId)
        ?.locations.includes(location._id)
    ) {
      const columnIndex = columns.findIndex(
        (column) => column.key === location.name
      );
      if (columnIndex !== -1) {
        columns.splice(columnIndex, 1);
      }
      const rowKeyIndex = rowKeys.findIndex(
        (rKey) => rKey.key === String(location._id)
      );
      if (rowKeyIndex !== -1) {
        rowKeys.splice(rowKeyIndex, 1);
      }
    }
  });
  const pageNavigations = [
    {
      name: t("Expiration Lists"),
      path: Routes.Expirations,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setExpirationActiveTab(ExpirationPageTabEnum.EXPIRATIONLISTS);
        resetGeneralContext();
      },
    },
    {
      name: currentExpirationList?.name ?? "",
      path: "",
      canBeClicked: false,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [
    expirationLists,
    products,
    expirationListId,
    locations,
    expirationCounts,
  ]);

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={expirationListOption}
              value={
                selectedExpirationList
                  ? {
                      value: selectedExpirationList._id,
                      label: selectedExpirationList.name,
                    }
                  : expirationListId
                  ? {
                      value: expirationListId,
                      label:
                        getItem(expirationListId, expirationLists ?? [])
                          ?.name || t("Select a expiration list"),
                    }
                  : null
              }
              onChange={(selectedOption) => {
                setSelectedExpirationList(
                  expirationLists?.find((p) => p._id === selectedOption?.value)
                );
                resetGeneralContext();
                navigate(`/expiration-list/${selectedOption?.value}`);
              }}
              placeholder={t("Select a expiration list")}
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
              user && [RoleEnum.MANAGER].includes(user.role._id)
                ? actions
                : undefined
            }
            addButton={
              user && [RoleEnum.MANAGER].includes(user.role._id)
                ? addButton
                : undefined
            }
            filters={filters}
            title={
              expirationLists?.find((row) => row._id === expirationListId)?.name
            }
            isActionsActive={true}
          />
          {isExpirationCountLocationModalOpen && (
            <GenericAddEditPanel
              isOpen={isExpirationCountLocationModalOpen}
              close={() => setIsExpirationCountLocationModalOpen(false)}
              inputs={countLocationInputs}
              formKeys={countLocationFormKeys}
              //  eslint-disable-next-line
              submitItem={() => {}}
              submitFunction={async () => {
                if (countLocationForm.location === 0 || !user) return;
                if (
                  expirationCounts?.filter((item) => {
                    return (
                      item.isCompleted === false &&
                      item.location === countLocationForm.location &&
                      item.user === user._id &&
                      item.expirationList === expirationListId
                    );
                  }).length > 0
                ) {
                  resetGeneralContext();
                  navigate(
                    `/expiration/${countLocationForm.location}/${expirationListId}`
                  );
                } else {
                  createExpirationCount({
                    location: countLocationForm.location,
                    expirationList: expirationListId,
                    isCompleted: false,
                    createdAt: new Date(),
                    user: user._id,
                  });
                  resetGeneralContext();
                  navigate(
                    `/expiration/${countLocationForm.location}/${expirationListId}`
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

export default ExpirationList;
