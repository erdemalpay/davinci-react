import { Dialog, Transition } from "@headlessui/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MultiValue, SingleValue } from "react-select";
import { useDataContext } from "../../../context/Data.context";
import { OptionType, Point } from "../../../types";
import { useGetConsumersWithFullNames } from "../../../utils/api/consumer";
import { useGetPoints } from "../../../utils/api/point";
import { GenericButton } from "../../common/GenericButton";
import SelectInput from "../../panelComponents/FormElements/SelectInput";
type Props = {
  isOpen: boolean;
  close: () => void;
  onConfirm: (
    pointUser: string | undefined,
    pointConsumer: number | undefined,
    amount: number
  ) => void;
  requiredAmount: number;
};

const PointUserSelectionModal = ({
  isOpen,
  close,
  onConfirm,
  requiredAmount,
}: Props) => {
  const { t } = useTranslation();
  const { users } = useDataContext();
  const consumers = useGetConsumersWithFullNames();
  const points = useGetPoints();
  const [selectedUser, setSelectedUser] = useState<string>("");

  const userPointsMap = useMemo(() => {
    const map: Record<string, number> = {};
    points?.forEach((point: Point) => {
      if (point.user) {
        map[point.user] = point.amount;
      }
    });
    return map;
  }, [points]);

  const consumerPointsMap = useMemo(() => {
    const map: Record<number, number> = {};
    points?.forEach((point: Point) => {
      if (point.consumer) {
        // Handle both populated object and ID cases
        const consumerId =
          typeof point.consumer === "object" && "_id" in point.consumer
            ? point.consumer._id
            : (point.consumer as unknown as number);

        if (consumerId) {
          map[consumerId] = point.amount;
        }
      }
    });
    return map;
  }, [points]);

  const options = useMemo(() => {
    const userOpts =
      users
        ?.filter((user) => userPointsMap[user._id] > 0)
        ?.map((user) => ({
          value: user._id,
          label: `${user.name}`,
          type: "user",
        })) || [];

    const consumerOpts =
      consumers
        ?.filter((consumer) => consumerPointsMap[consumer._id] > 0)
        ?.map((consumer) => ({
          value: consumer._id.toString(),
          label: `${consumer.fullName} (${
            consumerPointsMap[consumer._id]?.toFixed(0) || 0
          })`,
          type: "consumer",
        })) || [];

    return [...userOpts, ...consumerOpts];
  }, [users, consumers, userPointsMap, consumerPointsMap]);

  const selectedOption =
    options.find((option) => option.value === selectedUser) || null;

  const selectedUserPoints = selectedOption
    ? selectedOption.type === "user"
      ? userPointsMap[selectedOption.value] || 0
      : consumerPointsMap[Number(selectedOption.value)] || 0
    : 0;
  const hasSufficientPoints = selectedUserPoints >= requiredAmount;
  const actualAmount = hasSufficientPoints ? requiredAmount : 0;

  const handleSelectChange = (
    value: SingleValue<OptionType> | MultiValue<OptionType>
  ) => {
    if (value && !Array.isArray(value) && "value" in value) {
      setSelectedUser(value.value as string);
    } else {
      setSelectedUser("");
    }
  };

  const handleConfirm = () => {
    if (!selectedUser || !hasSufficientPoints) {
      return;
    }
    if (selectedOption?.type === "user") {
      onConfirm(selectedUser, undefined, actualAmount);
    } else {
      onConfirm(undefined, Number(selectedUser), actualAmount);
    }
    setSelectedUser("");
    close();
  };

  const handleClose = () => {
    setSelectedUser("");
    close();
  };

  return (
    <Transition
      show={isOpen}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog onClose={handleClose}>
        <Dialog.Overlay />
        <div
          id="popup"
          className="z-[99999] fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={handleClose}
            className="w-full h-full bg-gray-900 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 lg:w-2/5">
                {/* Header */}
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-center lg:justify-start">
                  <p className="text-base font-semibold">
                    {t("Select Point User")}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* User Selection */}
                    <SelectInput
                      label={t("Point User")}
                      value={selectedOption}
                      options={options}
                      placeholder={t("Select User")}
                      isMultiple={false}
                      requiredField={true}
                      onChange={handleSelectChange}
                      onClear={() => setSelectedUser("")}
                    />

                    {/* Amount Info */}
                    {selectedUser && (
                      <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {t("Required Amount")}:
                          </span>
                          <span className="font-semibold">
                            {requiredAmount.toFixed(2)} ₺
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {t("Available Points")}:
                          </span>
                          <span className="font-semibold">
                            {selectedUserPoints.toFixed(2)} ₺
                          </span>
                        </div>
                        {hasSufficientPoints ? (
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-sm font-medium">
                              {t("Amount to be Paid")}:
                            </span>
                            <span className="font-bold text-blue-600">
                              {actualAmount.toFixed(2)} ₺
                            </span>
                          </div>
                        ) : (
                          <div className="border-t pt-2">
                            <p className="text-sm text-red-600 font-medium">
                              {t(
                                "Insufficient points. Payment cannot be processed."
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end mt-4">
                      <GenericButton
                        onClick={handleClose}
                        variant="danger"
                        size="sm"
                        className="px-6 py-3"
                      >
                        {t("Cancel")}
                      </GenericButton>
                      <GenericButton
                        onClick={handleConfirm}
                        variant="primary"
                        size="sm"
                        className={`px-6 py-3 ${
                          !selectedUser || !hasSufficientPoints
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!selectedUser || !hasSufficientPoints}
                      >
                        {t("Confirm")}
                      </GenericButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PointUserSelectionModal;
