import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import Loading from "../components/common/Loading";
import CommonSelectInput from "../components/common/SelectInput";
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
import { ChecklistType, RoleEnum } from "../types";
import { useCheckMutations, useGetChecks } from "../utils/api/checklist/check";
import {
  useChecklistMutations,
  useGetChecklists,
} from "../utils/api/checklist/checklist";
import { useGetStoreLocations } from "../utils/api/location";
import { getItem } from "../utils/getItem";
import { LocationInput } from "../utils/panelInputs";

interface LocationEntries {
  [key: string]: boolean;
}
const Checklist = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checklistId } = useParams();
  const { user } = useUserContext();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const { createCheck } = useCheckMutations();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const checks = useGetChecks();
  const checklists = useGetChecklists();
  const { resetGeneralContext } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const [form, setForm] = useState({
    duty: "",
  });
  const [isLocationEdit, setIsLocationEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { updateChecklist } = useChecklistMutations();
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistType>();
  if (!user || !checklists || !checklistId || !locations || !checks)
    return <Loading />;

  function handleLocationUpdate(row: any, changedLocationId: number) {
    const currentChecklist = checklists?.find(
      (item) => item._id === checklistId
    );
    if (!currentChecklist) return;
    const currentLocations = currentChecklist?.duties?.find(
      (d) => d.duty === row.duty
    )?.locations;
    const newDuties = [
      ...(currentChecklist.duties?.filter((d) => d.duty !== row.duty) || []),
      {
        duty: row.duty,
        locations: currentLocations
          ? currentLocations?.includes(changedLocationId)
            ? currentLocations?.filter((l) => l !== changedLocationId)
            : [...currentLocations, changedLocationId]
          : [],
      },
    ];
    if (!checklistId) return;
    updateChecklist({
      id: checklistId,
      updates: { duties: newDuties },
    });

    toast.success(`${t("Checklist updated successfully")}`);
  }
  const rows = () => {
    let dutyRows = [];
    const currentChecklist = checklists?.find(
      (item) => item._id === checklistId
    );
    if (currentChecklist && currentChecklist.duties) {
      for (let item of currentChecklist.duties) {
        const locationEntries = locations?.reduce<LocationEntries>(
          (acc, location) => {
            acc[location._id] = item.locations?.includes(location._id) ?? false;
            return acc;
          },
          {}
        );
        dutyRows.push({
          duty: item.duty,
          ...locationEntries,
        });
      }
    }
    dutyRows = dutyRows.sort((a, b) => {
      if (a.duty < b.duty) {
        return -1;
      }
      if (a.duty > b.duty) {
        return 1;
      }
      return 0;
    });
    return dutyRows;
  };
  const addDutyInputs = [
    {
      type: InputTypes.TEXTAREA,
      formKey: "duty",
      label: t("Duty"),
      placeholder: t("Duty"),
      required: true,
    },
  ];
  const addDutyFormKeys = [{ key: "duty", type: FormKeyTypeEnum.STRING }];
  const [checkLocationForm, setCheckLocationForm] = useState({
    location: 0,
  });
  const checkLocationInputs = [
    LocationInput({
      locations: locations.filter((l) =>
        checklists
          ?.find((row) => row._id === checklistId)
          ?.locations?.includes(l._id)
      ),
    }),
  ];
  const checkLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [{ key: "duty" }];
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
        inputs={addDutyInputs}
        formKeys={addDutyFormKeys}
        submitItem={() => {}}
        isEditMode={true}
        buttonName={t("Add")}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const checklistDuties = () => {
            let dutyRows = [];
            const duties =
              checklists?.find((item) => item._id === checklistId)?.duties ||
              [];
            const newDuty = {
              duty: form.duty,
              locations:
                checklists?.find((item) => item._id === checklistId)
                  ?.locations ?? [],
            };
            dutyRows = [...duties, newDuty];
            return dutyRows;
          };
          updateChecklist({
            id: checklistId,
            updates: {
              duties: checklistDuties(),
            },
          });
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
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            if (checklistId && rowToAction) {
              const currentChecklist = getItem(checklistId, checklists);
              const newDuties = currentChecklist?.duties?.filter(
                (item) => item.duty !== rowToAction.duty
              );
              updateChecklist({
                id: checklistId,
                updates: {
                  duties: newDuties,
                },
              });
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Task")}
          text={`${rowToAction.duty} ${t("GeneralDeleteMessage")}`}
        />
      ) : (
        ""
      ),
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
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
          inputs={addDutyInputs}
          formKeys={addDutyFormKeys}
          setForm={setForm}
          submitItem={updateChecklist as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          constantValues={{ duty: rowToAction.duty }}
          handleUpdate={() => {
            const checklistDuties = () => {
              let dutyRows = [];
              const currentChecklist = getItem(checklistId, checklists);
              const filteredDuties = currentChecklist?.duties?.filter(
                (item) => item.duty !== rowToAction.duty
              );
              const newDuty = {
                duty: form.duty,
                locations:
                  checklists?.find((item) => item._id === checklistId)
                    ?.locations ?? [],
              };
              dutyRows = [...(filteredDuties ?? []), newDuty];
              return dutyRows;
            };
            if (!checklistId) return;
            updateChecklist({
              id: checklistId,
              updates: {
                duties: checklistDuties(),
              },
            });
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
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("Checkit")}
          onclick={() => {
            setIsCheckModalOpen(true);
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
  }, [checklists, locations, user, checks, checklistId]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={checklists?.map((p) => ({
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
                      value: checklistId,
                      label:
                        getItem(checklistId, checklists)?.name ??
                        t("Select a checklist"),
                    }
              }
              onChange={(selectedOption) => {
                setSelectedChecklist(
                  checklists?.find((p) => p._id === selectedOption?.value)
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
            isToolTipEnabled={false}
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
            title={checklists?.find((p) => p._id === checklistId)?.name}
            isActionsActive={true}
          />
        </div>
        {isCheckModalOpen && (
          <GenericAddEditPanel
            isOpen={isCheckModalOpen}
            close={() => setIsCheckModalOpen(false)}
            inputs={checkLocationInputs}
            formKeys={checkLocationFormKeys}
            submitItem={() => {}}
            submitFunction={async () => {
              if (checkLocationForm.location === 0 || !user) return;
              if (
                checks?.filter((item) => {
                  return (
                    item.isCompleted === false &&
                    item.location === checkLocationForm.location &&
                    item.user === user._id &&
                    item.checklist === checklistId
                  );
                }).length > 0
              ) {
                resetGeneralContext();
                navigate(`/check/${checkLocationForm.location}/${checklistId}`);
              } else {
                createCheck({
                  location: checkLocationForm.location,
                  checklist: checklistId,
                  isCompleted: false,
                  createdAt: new Date(),
                  user: user._id,
                });
                resetGeneralContext();
                navigate(`/check/${checkLocationForm.location}/${checklistId}`);
              }
            }}
            setForm={setCheckLocationForm}
            isEditMode={false}
            topClassName="flex flex-col gap-2 "
            buttonName={t("Submit")}
          />
        )}
      </div>
    </>
  );
};

export default Checklist;
