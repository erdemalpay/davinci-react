import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { GiSevenPointedStar } from "react-icons/gi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { Point, RoleEnum } from "../../types";
import { UpdatePayload } from "../../utils/api";
import { useGetConsumersWithFullNames } from "../../utils/api/consumer";
import { useGetPoints, usePointMutations } from "../../utils/api/point";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

export interface PointRow extends Point {
  consumerName: string;
}

const ConsumerPointComponent = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const points = useGetPoints();
  const consumers = useGetConsumersWithFullNames();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<PointRow>();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const { createPoint, deletePoint, updatePoint } = usePointMutations();

  const allRows = useMemo(() => {
    return points
      ?.filter((point) => !!point?.consumer)
      ?.map((point: Point) => {
        let consumerName = "";
        if (typeof point.consumer === "object" && "fullName" in point.consumer) {
          consumerName = point.consumer.fullName || "";
        } else {
          const consumerId = point.consumer as unknown as number;
          const consumer = consumers?.find((c) => c._id === consumerId);
          consumerName = consumer?.fullName || "";
        }

        return {
          ...point,
          consumerName,
        };
      });
  }, [points, consumers]);

  const columns = useMemo(
    () => [
      { key: t("Consumer"), isSortable: true },
      { key: t("Amount"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "consumerName" }, { key: "amount" }],
    []
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "consumer",
        label: t("Consumer"),
        options: consumers?.map((consumer) => ({
          value: consumer._id,
          label: consumer.fullName,
        })),
        isAutoFill: false,
        placeholder: t("Consumer"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "amount",
        label: t("Amount"),
        placeholder: t("Amount"),
        required: true,
      },
    ],
    [t, consumers]
  );

  const formKeys = useMemo(
    () => [
      { key: "consumer", type: FormKeyTypeEnum.STRING },
      { key: "amount", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Point"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={
            createPoint as unknown as (
              item: Partial<Point> | UpdatePayload<Partial<Point>>
            ) => void
          }
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      icon: <GiSevenPointedStar className="text-xl" />,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, inputs, formKeys, createPoint, user]
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
              deletePoint(rowToAction._id);
              setIsDeleteConfirmationOpen(false);
            }}
            title={t("Delete Action")}
            text={t("All points will be removed")}
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
            inputs={inputs}
            formKeys={formKeys}
            submitItem={
              updatePoint as unknown as (
                item: PointRow | UpdatePayload<PointRow>
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
    ],
    [
      t,
      rowToAction,
      isDeleteConfirmationOpen,
      deletePoint,
      isEditModalOpen,
      inputs,
      formKeys,
      updatePoint,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={allRows}
        title={t("Consumers Points")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default ConsumerPointComponent;
