import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ChecklistType, RoleEnum } from "../types";
import {
  useChecklistMutations,
  useGetChecklists,
} from "../utils/api/checklist/checklist";
import { useGetStockLocations } from "../utils/api/location";

const Checklist = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checklistId } = useParams();
  const { user } = useUserContext();
  const locations = useGetStockLocations();
  const checklists = useGetChecklists();
  const { resetGeneralContext } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const [isLocationEdit, setIsLocationEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { updateChecklist } = useChecklistMutations();
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistType>();

  const currentChecklist = checklists?.find((item) => item._id === checklistId);
  if (!user || !currentChecklist) return <></>;

  function handleLocationUpdate(row: any, changedLocationId: number) {
    const currentChecklist = checklists?.find(
      (item) => item._id === checklistId
    );

    if (!currentChecklist) return;
    // const newProducts = [
    //   ...(currentChecklist.products?.filter(
    //     (p) =>
    //       p.product !==
    //       (products.find((it) => it.name === row.product)?._id ?? "")
    //   ) || []),

    //   {
    //     product: products.find((it) => it.name === row.product)?._id ?? "",
    //     locations: Object.entries(row).reduce((acc, [key, value]) => {
    //       if (key === "product" || typeof key !== "number") return acc;
    //       if (key === changedLocationId) {
    //         if (!value) {
    //           acc.push(key);
    //         }
    //       } else if (value) {
    //         acc.push(key);
    //       }
    //       return acc;
    //     }, [] as number[]),
    //   },
    // ];

    //  updateChecklist({
    //    id: currentCountList._id,
    //    updates: { products: newProducts },
    //  });

    //  toast.success(`${t("Count List updated successfully")}`);
  }
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys = checklists?.map((checklist) => ({
    key: checklist._id,
    node: (row: any) => (
      <p
        className="text-blue-700 cursor-pointer hover:text-blue-500 transition-transform"
        onClick={() => navigate(`/checklist-detail/${checklist._id}`)}
      >
        {checklist.name}
      </p>
    ),
  }));

  locations.forEach((item) => {
    columns.push({ key: item.name, isSortable: true });
    rowKeys.push({
      key: String(item._id),
      node: (row: any) =>
        isLocationEdit ? (
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
    name: t("Add Task"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={[]}
        formKeys={[]}
        submitItem={() => {}}
        isEditMode={true}
        setForm={() => {}}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          // Define logic for updating the checklist with a new task
        }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
  };

  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: () => {},
      modal: (
        <ConfirmationDialog
          isOpen={false}
          close={() => {}}
          confirm={() => {}}
          title={t("Delete Task")}
          text={t("Are you sure you want to delete this task?")}
        />
      ),
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: false,
      setIsModal: () => {},
      isPath: false,
    },
  ];

  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: true,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
        : true,
      node: (
        <Switch
          checked={isLocationEdit}
          onChange={() => setIsLocationEdit((value) => !value)}
          className={`${isLocationEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isLocationEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [checklists, locations]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={checklists.map((p) => ({
                value: p._id,
                label: p.name,
              }))}
              value={
                selectedChecklist
                  ? {
                      value: selectedChecklist._id,
                      label: selectedChecklist.name,
                    }
                  : {
                      value: currentChecklist._id,
                      label: currentChecklist.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedChecklist(
                  checklists.find((p) => p._id === selectedOption?.value)
                );
                resetGeneralContext();
                navigate(`/checklist/${selectedOption?.value}`);
              }}
              placeholder={t("Select a checklist")}
            />
          </div>
        </div>
        <div className="w-[95%] my-5 mx-auto ">
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={checklists}
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
            title={currentChecklist.name}
            isActionsActive={true}
          />
        </div>
      </div>
    </>
  );
};

export default Checklist;
