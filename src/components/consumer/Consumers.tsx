import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash, HiOutlineUserAdd } from "react-icons/hi";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { Consumer, ConsumerStatus, RoleEnum } from "../../types";
import { UpdatePayload } from "../../utils/api";
import {
  useConsumerMutations,
  useGetConsumers,
} from "../../utils/api/consumer";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};

const Consumers = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [filterConsumerPanelFormElements, setFilterConsumerPanelFormElements] =
    useState<FormElementsState>({
      search: "",
    });
  const [statusFilter, setStatusFilter] = useState<ConsumerStatus | undefined>(
    ConsumerStatus.ACTIVE
  );
  const consumersPayload = useGetConsumers(
    currentPage,
    rowsPerPage,
    statusFilter,
    filterConsumerPanelFormElements
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Consumer>();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const { createConsumer, updateConsumer, deleteConsumer } =
    useConsumerMutations();

  const [showInactive, setShowInactive] = useState(false);

  function handleConsumerUpdate(consumer: Consumer) {
    updateConsumer({
      id: consumer._id,
      updates: {
        status:
          consumer.status === ConsumerStatus.ACTIVE
            ? ConsumerStatus.INACTIVE
            : ConsumerStatus.ACTIVE,
      },
    });
    toast.success(`Consumer ${consumer.name} updated`);
  }

  // Update status filter when toggle changes
  useEffect(() => {
    setStatusFilter(showInactive ? undefined : ConsumerStatus.ACTIVE);
  }, [showInactive]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterConsumerPanelFormElements, statusFilter, setCurrentPage]);

  const rows = useMemo(() => {
    return consumersPayload?.data ?? [];
  }, [consumersPayload]);

  const pagination = useMemo(() => {
    return consumersPayload
      ? {
          totalPages: consumersPayload.totalPages,
          totalRows: consumersPayload.totalNumber,
        }
      : null;
  }, [consumersPayload]);

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true, correspondingKey: "name" },
      { key: t("Surname"), isSortable: true, correspondingKey: "surname" },
      { key: t("User Name"), isSortable: true, correspondingKey: "userName" },
      { key: t("Email"), isSortable: true, correspondingKey: "email" },
      { key: t("Phone"), isSortable: true, correspondingKey: "phone" },
      { key: t("Address"), isSortable: true, correspondingKey: "address" },
      { key: t("Birth Date"), isSortable: true, correspondingKey: "birthDate" },
      { key: t("Full Name"), isSortable: true, correspondingKey: "fullName" },
      { key: t("Created At"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "surname" },
      { key: "userName" },
      { key: "email" },
      { key: "phone" },
      { key: "address" },
      {
        key: "birthDate",
        node: (row: Consumer) =>
          row.birthDate
            ? new Date(row.birthDate).toLocaleDateString("en-GB")
            : "",
      },
      { key: "fullName" },
      {
        key: "createdAt",
        node: (row: Consumer) =>
          new Date(row.createdAt).toLocaleDateString("en-GB"),
      },
    ],
    []
  );

  const addInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "surname",
        label: t("Surname"),
        placeholder: t("Surname"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "userName",
        label: t("User Name"),
        placeholder: t("User Name"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "email",
        label: t("Email"),
        placeholder: t("Email"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "phone",
        label: t("Phone"),
        placeholder: t("Phone"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "address",
        label: t("Address"),
        placeholder: t("Address"),
        required: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "birthDate",
        label: t("Birth Date"),
        placeholder: t("Birth Date"),
        required: false,
        isDatePicker: true,
      },
      //   {
      //     type: InputTypes.PASSWORD,
      //     formKey: "password",
      //     label: t("Password"),
      //     placeholder: t("Password"),
      //     required: true,
      //   },
    ],
    [t]
  );

  const editInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "surname",
        label: t("Surname"),
        placeholder: t("Surname"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "userName",
        label: t("User Name"),
        placeholder: t("User Name"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "email",
        label: t("Email"),
        placeholder: t("Email"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "phone",
        label: t("Phone"),
        placeholder: t("Phone"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "address",
        label: t("Address"),
        placeholder: t("Address"),
        required: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "birthDate",
        label: t("Birth Date"),
        placeholder: t("Birth Date"),
        required: false,
        isDatePicker: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: [
          { value: ConsumerStatus.ACTIVE, label: t("Active") },
          { value: ConsumerStatus.INACTIVE, label: t("Inactive") },
        ],
        placeholder: t("Status"),
        required: true,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "surname", type: FormKeyTypeEnum.STRING },
      { key: "userName", type: FormKeyTypeEnum.STRING },
      { key: "email", type: FormKeyTypeEnum.STRING },
      { key: "phone", type: FormKeyTypeEnum.STRING },
      { key: "address", type: FormKeyTypeEnum.STRING },
      { key: "birthDate", type: FormKeyTypeEnum.DATE },
      //   { key: "password", type: FormKeyTypeEnum.STRING },
      { key: "status", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Consumer"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={addInputs}
          formKeys={formKeys}
          submitItem={
            createConsumer as unknown as (
              item: Partial<Consumer> | UpdatePayload<Partial<Consumer>>
            ) => void
          }
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      icon: <HiOutlineUserAdd className="text-2xl" />,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, addInputs, formKeys, createConsumer, user]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteConfirmationOpen}
            close={() => setIsDeleteConfirmationOpen(false)}
            confirm={() => {
              deleteConsumer(rowToAction._id);
              setIsDeleteConfirmationOpen(false);
            }}
            title={t("Delete Consumer")}
            text={t("Are you sure you want to delete this consumer?")}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isDeleteConfirmationOpen,
        setIsModal: setIsDeleteConfirmationOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
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
            inputs={editInputs}
            formKeys={formKeys}
            submitItem={
              updateConsumer as unknown as (
                item: Consumer | UpdatePayload<Consumer>
              ) => void
            }
            isEditMode={true}
            topClassName="flex flex-col gap-2"
            itemToEdit={{
              id: rowToAction._id,
              updates: rowToAction,
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
      {
        name: t("Toggle Active"),
        isDisabled: !showInactive,
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: Consumer) => (
          <div className="mt-2">
            <CheckSwitch
              checked={row.status === ConsumerStatus.ACTIVE}
              onChange={() => handleConsumerUpdate(row)}
            />
          </div>
        ),
      },
    ],
    [
      t,
      rowToAction,
      isDeleteConfirmationOpen,
      deleteConsumer,
      isEditModalOpen,
      editInputs,
      formKeys,
      updateConsumer,
      user,
      showInactive,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Inactive Users"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showInactive}
            onChange={() => setShowInactive(!showInactive)}
          />
        ),
      },
    ],
    [t, showInactive]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterConsumerPanelFormElements,
      setFilterPanelFormElements: setFilterConsumerPanelFormElements,
    }),
    [filterConsumerPanelFormElements, setFilterConsumerPanelFormElements]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterConsumerPanelFormElements,
      setFilterPanelFormElements: setFilterConsumerPanelFormElements,
    };
  }, [t, filterConsumerPanelFormElements, setFilterConsumerPanelFormElements]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Consumers")}
        addButton={addButton}
        filters={filters}
        isActionsActive={true}
        isSearch={false}
        outsideSortProps={outsideSort}
        outsideSearchProps={outsideSearchProps}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
};

export default Consumers;
