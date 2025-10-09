import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown } from "react-icons/fa6";
import { IoIosClose } from "react-icons/io";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { toast } from "react-toastify";
import { GenericButton } from "../../common/GenericButton";
import { useGeneralContext } from "../../../context/General.context";
import { useOrderContext } from "../../../context/Order.context";
import { NO_IMAGE_URL } from "../../../navigation/constants";
import { FormElementsState, OptionType } from "../../../types";
import { UpdatePayload, postWithHeader } from "../../../utils/api";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import { H6 } from "../Typography";
import {
  FormKeyType,
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../shared/types";
import DateInput from "./DateInput";
import HourInput from "./HourInput";
import MonthYearInput from "./MonthYearInput";
import SelectInput from "./SelectInput";
import TabInput from "./TabInput";
import TabInputScreen from "./TabInputScreen";
import TextInput from "./TextInput";

type Props<T> = {
  isOpen: boolean;
  close?: () => void;
  inputs: GenericInputType[];
  formKeys: FormKeyType[];
  topClassName?: string;
  nonImageInputsClassName?: string;
  onOpenTriggerTabInputFormKey?: string;
  generalClassName?: string;
  submitItem: (item: T | UpdatePayload<T>) => void;
  setForm?: (item: T) => void;
  handleUpdate?: () => void;
  submitFunction?: () => void;
  additionalSubmitFunction?: () => void;
  additionalCancelFunction?: () => void;
  constantValues?: { [key: string]: any };
  isCancelConfirmationDialogExist?: boolean;
  isCreateConfirmationDialogExist?: boolean;
  isCreateCloseActive?: boolean;
  optionalCreateButtonActive?: boolean;
  isEditMode?: boolean;
  folderName?: string;
  buttonName?: string;
  cancelButtonLabel?: string;
  anotherPanel?: React.ReactNode;
  anotherPanelTopClassName?: string;
  createConfirmationDialogText?: string;
  createConfirmationDialogHeader?: string;
  isConfirmationDialogRequired?: () => boolean;
  confirmationDialogHeader?: string;
  confirmationDialogText?: string;
  isSubmitButtonActive?: boolean;
  upperMessage?: string;
  additionalButtons?: AdditionalButtonProps[];
  itemToEdit?: {
    id: number | string;
    updates: T;
  };
};

type AdditionalButtonProps = {
  onClick: () => void;
  label: string;
  isInputRequirementCheck?: boolean;
  isInputNeedToBeReset?: boolean;
  preservedKeys?: string[];
};
const GenericAddEditPanel = <T,>({
  isOpen,
  close,
  inputs,
  formKeys,
  additionalButtons,
  topClassName,
  generalClassName,
  buttonName,
  constantValues,
  isEditMode = false,
  itemToEdit,
  folderName,
  handleUpdate,
  anotherPanel,
  optionalCreateButtonActive,
  cancelButtonLabel = "Cancel",
  submitFunction,
  additionalSubmitFunction,
  additionalCancelFunction,
  isSubmitButtonActive = true,
  isCancelConfirmationDialogExist = false,
  isCreateConfirmationDialogExist = false,
  createConfirmationDialogText,
  createConfirmationDialogHeader,
  isCreateCloseActive = true,
  anotherPanelTopClassName,
  isConfirmationDialogRequired,
  confirmationDialogText,
  confirmationDialogHeader,
  onOpenTriggerTabInputFormKey,
  upperMessage,
  setForm,
  submitItem,
  nonImageInputsClassName,
}: Props<T>) => {
  const { t } = useTranslation();
  const [allRequiredFilled, setAllRequiredFilled] = useState(false);
  const [imageFormKey, setImageFormKey] = useState<string>("");
  const {
    isTabInputScreenOpen,
    tabInputScreenOptions,
    setTabInputFormKey,
    setTabInputInvalidateKeys,
    setIsTabInputScreenOpen,
    setTabInputScreenOptions,
  } = useGeneralContext();
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [resetTextInput, setResetTextInput] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [isCancelConfirmationDialogOpen, setIsCancelConfirmationDialogOpen] =
    useState(false);
  const [confirmationDialogFunction, setConfirmationDialogFunction] = useState<
    (() => void) | null
  >(null);
  const { setIsExtraModalOpen } = useOrderContext();
  const [isCreateConfirmationDialogOpen, setIsCreateConfirmationDialogOpen] =
    useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageInputs = inputs.filter((input) => input.type === InputTypes.IMAGE);
  const nonImageInputs = inputs.filter(
    (input) => input.type !== InputTypes.IMAGE
  );
  const initialState = formKeys.reduce<FormElementsState>(
    (acc, { key, type }) => {
      let defaultValue;
      switch (type) {
        case FormKeyTypeEnum.STRING:
          defaultValue = "";
          break;
        case FormKeyTypeEnum.COLOR:
          defaultValue = "#ffffff";
          break;
        case FormKeyTypeEnum.NUMBER:
          defaultValue = null;
          break;
        case FormKeyTypeEnum.BOOLEAN:
          defaultValue = false;
          break;
        case FormKeyTypeEnum.DATE:
          defaultValue = "";
          break;
        default:
          defaultValue = null;
      }
      acc[key] = defaultValue;
      return acc;
    },
    {}
  );
  const mergedInitialState = { ...initialState, ...constantValues };
  const [formElements, setFormElements] = useState(() => {
    if (isEditMode && itemToEdit) {
      return itemToEdit.updates as unknown as FormElementsState;
    }
    return mergedInitialState;
  });
  const handleClose = () => {
    setIsExtraModalOpen?.(false);
    close?.();
  };
  const uploadImageMutation = useMutation(
    async ({ file, filename }: { file: File; filename: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename);
      formData.append("foldername", folderName ?? "forgotton");

      const res = await postWithHeader<FormData, { url: string }>({
        path: "/asset/upload",
        payload: formData,
        headers: new AxiosHeaders({
          "Content-Type": "multipart/form-data",
        }),
      });
      return res;
    },
    {
      onSuccess: (data) => {
        setFormElements((prev) => ({ ...prev, [imageFormKey]: data.url }));
      },
      onError: (error) => {
        console.error("Error uploading file:", error);
      },
    }
  );
  const triggerOnTriggerTabInput = () => {
    if (!onOpenTriggerTabInputFormKey) return;
    const input = inputs.find(
      (i) => i.formKey === onOpenTriggerTabInputFormKey
    );
    if (input) {
      setTabInputScreenOptions(input.options ?? []);
      setIsTabInputScreenOpen(true);
      setTabInputFormKey(onOpenTriggerTabInputFormKey);
      setTabInputInvalidateKeys(input?.invalidateKeys ?? []);
    }
  };
  useEffect(() => {
    if (setForm) {
      setForm(formElements as T);
    }
    setAllRequiredFilled(areRequiredFieldsFilled());
  }, [formElements, inputs]);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        isEditMode ? additionalCancelFunction?.() : undefined;
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    // triggerOnTriggerTabInput();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, input: GenericInputType) => {
      setImageFormKey(input.formKey);
      if (event.target.files?.[0]) {
        const file = event.target.files[0];
        const filename = file.name;
        uploadImageMutation.mutate({
          file,
          filename,
        });
      }
    },
    [uploadImageMutation]
  );
  const finalSubmitFunction = () => {
    try {
      if (isEditMode && itemToEdit) {
        submitItem({ id: itemToEdit.id, updates: formElements as T });
      } else if (isEditMode && handleUpdate) {
        handleUpdate();
      } else {
        if (submitFunction) {
          submitFunction();
        } else {
          submitItem(formElements as T);
        }
      }
      additionalSubmitFunction?.();
      setFormElements(mergedInitialState);
      setResetTextInput(!resetTextInput);
      setAttemptedSubmit(false);
      isCreateCloseActive && close?.();
    } catch (error) {
      console.error("Failed to execute submit item:", error);
    }
  };
  const handleSubmit = () => {
    if (isConfirmationDialogRequired?.()) {
      setConfirmationDialogFunction(() => finalSubmitFunction);
      setIsConfirmationDialogOpen(true);
    } else {
      finalSubmitFunction();
    }
  };
  const isValueEmpty = (value: unknown) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === "";
  };
  const areRequiredFieldsFilled = () => {
    return inputs.every((input) => {
      if (!input.required) return true;
      return !isValueEmpty(formElements[input.formKey]);
    });
  };
  const handleInputClear = (input: GenericInputType) => {
    setFormElements((prev) => ({
      ...prev,
      [input.formKey]: initialState[input.formKey],
    }));
    if (input.invalidateKeys) {
      input.invalidateKeys.forEach((key) => {
        setFormElements((prev) => ({
          ...prev,
          [key.key]: initialState[key.key],
        }));
      });
    }
  };
  const handleCancelButtonClick = () => {
    additionalCancelFunction?.();
    handleClose();
  };
  const handleCreateButtonClick = () => {
    setAttemptedSubmit(true);
    if (!allRequiredFilled && !optionalCreateButtonActive) {
      toast.error(t("Please fill all required fields"));
      return;
    } else if (allRequiredFilled) {
      const phoneValidationFailed = inputs
        .filter((input) => input.additionalType === "phone")
        .some((input) => {
          const inputValue = formElements[input.formKey];
          if (!inputValue.match(/^[0-9]{11}$/)) {
            toast.error(t("Check phone number."));
            return true; // Validation failed for phone number
          }
          return false; // Validation passed for phone number
        });

      if (!phoneValidationFailed) {
        handleSubmit();
      }
    } else if (optionalCreateButtonActive) {
      if (!_.isEqual(formElements, mergedInitialState) && !allRequiredFilled) {
        toast.error(t("Please fill all required fields"));
        return;
      }
      handleSubmit();
    }
  };
  const renderGenericAddEditModal = () => {
    if (isTabInputScreenOpen) {
      return (
        <TabInputScreen
          options={tabInputScreenOptions.map((o) => ({
            value: o.value,
            label: o.label,
            imageUrl: o.imageUrl,
            keywords: o?.keywords,
            triggerExtraModal: o?.triggerExtraModal,
          }))}
          topClassName={generalClassName}
          formElements={formElements}
          setFormElements={setFormElements}
          inputs={inputs}
          setForm={setForm as any}
        />
      );
    }
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        className={`bg-white rounded-md shadow-lg ${
          anotherPanelTopClassName
            ? ""
            : "w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 max-w-full"
        }   max-h-[90vh]   ${generalClassName}`}
      >
        {upperMessage && (
          <div className="flex flex-row justify-between items-center px-4 py-2 border-b">
            <H6>{upperMessage}</H6>
          </div>
        )}
        <div className="rounded-tl-md rounded-tr-md px-4  flex flex-col gap-4 py-6 justify-between  h-full">
          <div
            className={`${
              topClassName
                ? topClassName
                : "grid grid-cols-1 md:grid-cols-2 gap-4 "
            }`}
          >
            <div>
              {/* Image inputs */}
              {imageInputs.map((input) => (
                <div className="flex flex-col gap-2" key={input.formKey}>
                  <img
                    src={
                      formElements[input.formKey]
                        ? formElements[input.formKey]
                        : NO_IMAGE_URL
                    }
                    alt="image"
                    className="w-full h-40 object-contain rounded-md"
                  />
                  <label
                    key={input.formKey}
                    className="w-fit ml-auto inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto border-b sm:border-b-0"
                  >
                    {t("Upload")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleFileChange(e, input);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}
            </div>
            <div
              className={`${
                nonImageInputsClassName
                  ? nonImageInputsClassName
                  : "flex flex-col gap-4"
              }`}
            >
              {/* nonimage inputs */}
              {nonImageInputs.map((input) => {
                const value = formElements[input.formKey];
                const handleChange = (key: string) => (value: string) => {
                  const changedInput = inputs.find(
                    (input) => input.formKey === key
                  );
                  setFormElements((prev) => ({ ...prev, [key]: value }));
                  if (changedInput?.invalidateKeys) {
                    changedInput.invalidateKeys.forEach((key) => {
                      setFormElements((prev) => ({
                        ...prev,
                        [key.key]: key.defaultValue,
                      }));
                    });
                  }
                };
                const handleChangeForSelect =
                  (key: string) =>
                  (
                    selectedValue:
                      | SingleValue<OptionType>
                      | MultiValue<OptionType>,
                    actionMeta: ActionMeta<OptionType>
                  ) => {
                    if (
                      actionMeta?.action === "select-option" ||
                      actionMeta?.action === "remove-value" ||
                      actionMeta?.action === "clear"
                    ) {
                      if (Array.isArray(selectedValue)) {
                        const values = selectedValue.map(
                          (option) => option.value
                        );
                        setFormElements((prev) => ({ ...prev, [key]: values }));
                      } else if (selectedValue) {
                        setFormElements((prev) => ({
                          ...prev,
                          [key]: (selectedValue as OptionType)?.value,
                        }));
                      } else {
                        setFormElements((prev) => ({ ...prev, [key]: "" }));
                      }
                    }
                    const changedInput = inputs.find(
                      (input) => input.formKey === key
                    );
                    if (changedInput?.invalidateKeys) {
                      changedInput.invalidateKeys.forEach((key) => {
                        setFormElements((prev) => ({
                          ...prev,
                          [key.key]: key.defaultValue,
                        }));
                      });
                    }
                  };
                if (
                  input.type === InputTypes.SELECT &&
                  !input?.required &&
                  input?.options?.length === 0
                ) {
                  return null;
                }
                if (!input?.isDisabled) {
                  const showError =
                    attemptedSubmit &&
                    input.required &&
                    isValueEmpty(formElements[input.formKey]);
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      key={input.formKey}
                      className="flex flex-col gap-1"
                    >
                      {input.type === InputTypes.DATE && (
                        <DateInput
                          key={input.formKey + resetTextInput}
                          value={value}
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          placeholder={input.placeholder ?? ""}
                          onChange={(val) =>
                            handleChange(input.formKey)(val ?? "")
                          }
                          isArrowsEnabled={input.isArrowsEnabled ?? false}
                          requiredField={input.required}
                          isOnClearActive={input?.isOnClearActive ?? true}
                          isDateInitiallyOpen={
                            input.isDateInitiallyOpen ?? false
                          }
                          isTopFlexRow={input.isTopFlexRow ?? false}
                          isReadOnly={input.isReadOnly ?? false}
                          onClear={() => {
                            handleInputClear(input);
                          }}
                        />
                      )}
                      {(input.type === InputTypes.TEXT ||
                        input.type === InputTypes.NUMBER ||
                        input.type === InputTypes.TIME ||
                        input.type === InputTypes.COLOR ||
                        input.type === InputTypes.CHECKBOX ||
                        input.type === InputTypes.PASSWORD) && (
                        <TextInput
                          key={input.formKey + resetTextInput}
                          type={input.type}
                          value={value}
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          placeholder={input.placeholder ?? ""}
                          onChange={handleChange(input.formKey)}
                          requiredField={input.required}
                          isOnClearActive={input?.isOnClearActive ?? true}
                          isNumberButtonsActive={
                            input?.isNumberButtonsActive ?? false
                          }
                          isDateInitiallyOpen={
                            input.isDateInitiallyOpen ?? false
                          }
                          isTopFlexRow={input.isTopFlexRow ?? false}
                          minNumber={input?.minNumber ?? 0}
                          isDebounce={input?.isDebounce ?? false}
                          isReadOnly={input.isReadOnly ?? false}
                          isMinNumber={input?.isMinNumber ?? true}
                          onClear={() => {
                            handleInputClear(input);
                          }}
                        />
                      )}
                      {input.type === InputTypes.HOUR && (
                        <HourInput
                          key={input.formKey}
                          value={value}
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          onChange={handleChange(input.formKey)}
                          requiredField={input.required}
                          isReadOnly={input.isReadOnly ?? false}
                        />
                      )}
                      {input.type === InputTypes.MONTHYEAR && (
                        <MonthYearInput
                          key={input.formKey}
                          value={value}
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          onChange={handleChange(input.formKey)}
                          requiredField={input.required}
                          isReadOnly={input.isReadOnly ?? false}
                        />
                      )}
                      {input.type === InputTypes.SELECT && (
                        <SelectInput
                          key={
                            input.isMultiple
                              ? input.formKey
                              : input.formKey + formElements[input.formKey]
                          }
                          value={
                            input.isMultiple
                              ? input.options?.filter((option) =>
                                  formElements[input.formKey]?.includes(
                                    option.value
                                  )
                                )
                              : input?.options?.find(
                                  (option) =>
                                    option?.value ===
                                    formElements[input.formKey]
                                )
                          }
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          suggestedOption={input?.suggestedOption}
                          isSortDisabled={input.isSortDisabled ?? false}
                          isAutoFill={input?.isAutoFill}
                          options={input.options ?? []}
                          placeholder={input.placeholder ?? ""}
                          isMultiple={input.isMultiple ?? false}
                          requiredField={input.required}
                          onChange={handleChangeForSelect(input.formKey)}
                          isTopFlexRow={input.isTopFlexRow ?? false}
                          onChangeTrigger={input?.onChangeTrigger}
                          isOnClearActive={input?.isOnClearActive ?? true}
                          isReadOnly={input.isReadOnly ?? false}
                          onClear={() => {
                            handleInputClear(input);
                          }}
                        />
                      )}
                      {input.type === InputTypes.TAB && (
                        <TabInput
                          key={input.formKey + formElements[input.formKey]}
                          value={input.options?.find(
                            (option) =>
                              option?.value === formElements[input.formKey]
                          )}
                          label={
                            input.required && input.label
                              ? input.label
                              : input.label ?? ""
                          }
                          suggestedOption={input?.suggestedOption || null}
                          formKey={input.formKey}
                          options={input.options ?? []}
                          placeholder={input.placeholder ?? ""}
                          invalidateKeys={input.invalidateKeys}
                          requiredField={input.required}
                          setFormElements={setFormElements}
                          setForm={setForm as any}
                          formElements={formElements}
                          isTopFlexRow={input.isTopFlexRow ?? false}
                          isReadOnly={input.isReadOnly ?? false}
                          onClear={() => {
                            handleInputClear(input);
                          }}
                        />
                      )}
                      {input.type === InputTypes.TEXTAREA && (
                        <div
                          key={input.formKey}
                          className="flex flex-col gap-2 relative"
                        >
                          <div className="flex items-center">
                            <H6>{input.label}</H6>
                            {input.required && (
                              <>
                                <span className="text-red-400">*</span>
                                <span className="text-xs text-gray-400">
                                  ({t("required")})
                                </span>
                              </>
                            )}
                            {input?.options && input?.options?.length > 0 && (
                              <GenericButton
                                variant="icon"
                                size="sm"
                                className="ml-2 p-1"
                                onClick={() =>
                                  setOpenFor((prev) =>
                                    prev === input.formKey
                                      ? null
                                      : input.formKey
                                  )
                                }
                              >
                                <FaChevronDown size={16} />
                              </GenericButton>
                            )}
                          </div>

                          {openFor === input.formKey && (
                            <>
                              {/* backdrop */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenFor(null)}
                              />

                              {/* dropdown */}
                              <ul className="absolute z-20 mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-auto">
                                {/* full-width cancel row */}
                                <li
                                  className="px-3 py-2 text-red-500 cursor-pointer hover:bg-gray-100"
                                  onMouseDown={() => setOpenFor(null)}
                                >
                                  {t("Close Selection")}
                                </li>

                                {input.options!.map((opt) => (
                                  <li
                                    key={opt.value}
                                    onMouseDown={() => {
                                      handleChange(input.formKey)(opt.value);
                                      setOpenFor(null);
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    {opt.label}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          <div className="relative">
                            <textarea
                              value={formElements[input.formKey]}
                              onChange={(e) =>
                                handleChange(input.formKey)(e.target.value)
                              }
                              placeholder={input.placeholder}
                              className={`border text-base border-gray-300 rounded-md p-2 w-full ${input.inputClassName}`}
                            />
                            {formElements[input.formKey] && (
                              <GenericButton
                                variant="icon"
                                size="sm"
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 p-0"
                                onClick={() => handleChange(input.formKey)("")}
                              >
                                <IoIosClose size={20} />
                              </GenericButton>
                            )}
                          </div>
                        </div>
                      )}
                      {showError && (
                        <span className="text-xs text-red-600">
                          {t("This field is required")}
                        </span>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
          <div className="ml-auto flex flex-row gap-4 mt-auto ">
            <GenericButton
              variant="danger"
              size="sm"
              onClick={() => {
                isCancelConfirmationDialogExist
                  ? setIsCancelConfirmationDialogOpen(true)
                  : handleCancelButtonClick();
              }}
            >
              {t(cancelButtonLabel)}
            </GenericButton>
            {additionalButtons &&
              additionalButtons.map((button, index) => {
                return (
                  <GenericButton
                    key={index}
                    variant={
                      button.isInputRequirementCheck && !allRequiredFilled
                        ? "secondary"
                        : "primary"
                    }
                    size="sm"
                    onClick={() => {
                      const handleButtonClick = () => {
                        const preservedValues = button.preservedKeys?.reduce<
                          Partial<typeof formElements>
                        >((acc, key) => {
                          acc[key] = formElements[key];
                          return acc;
                        }, {});

                        button.onClick();

                        if (button?.isInputNeedToBeReset) {
                          setFormElements({
                            ...(constantValues
                              ? { ...initialState, ...constantValues }
                              : initialState),
                            ...preservedValues,
                          });
                          setResetTextInput((prev) => !prev);
                          setAttemptedSubmit(false);
                        }
                        // triggerOnTriggerTabInput();
                      };

                      if (isConfirmationDialogRequired?.()) {
                        setConfirmationDialogFunction(() => handleButtonClick);
                        setIsConfirmationDialogOpen(true);
                      } else {
                        handleButtonClick();
                      }
                    }}
                  >
                    {t(button.label)}
                  </GenericButton>
                );
              })}
            {isSubmitButtonActive && (
              <GenericButton
                variant={
                  !allRequiredFilled && !optionalCreateButtonActive
                    ? "secondary"
                    : "primary"
                }
                size="sm"
                onClick={() => {
                  if (isCreateConfirmationDialogExist) {
                    setIsCreateConfirmationDialogOpen(true);
                  } else {
                    handleCreateButtonClick();
                  }
                }}
              >
                {buttonName
                  ? buttonName
                  : isEditMode
                  ? t("Update")
                  : t("Create")}
              </GenericButton>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      className={`__className_a182b8 fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ${
        !isOpen && "hidden"
      }`}
    >
      {anotherPanel ? (
        <div className={`${anotherPanelTopClassName} rounded-md bg-white`}>
          {anotherPanel}
          {renderGenericAddEditModal()}
        </div>
      ) : (
        renderGenericAddEditModal()
      )}
      {isCancelConfirmationDialogOpen && (
        <ConfirmationDialog
          isOpen={isCancelConfirmationDialogOpen}
          close={() => {
            setIsCancelConfirmationDialogOpen(false);
          }}
          confirm={() => {
            handleCancelButtonClick();
          }}
          title={t("Cancel Entry")}
          text={`${t("Are you sure you want to cancel this entry?")}`}
        />
      )}
      {isCreateConfirmationDialogOpen && (
        <ConfirmationDialog
          isOpen={isCreateConfirmationDialogOpen}
          close={() => {
            setIsCreateConfirmationDialogOpen(false);
          }}
          confirm={() => {
            handleCreateButtonClick();
            setIsCreateConfirmationDialogOpen(false);
          }}
          title={createConfirmationDialogHeader ?? t("Create Entry")}
          text={
            createConfirmationDialogText ??
            `${t("Are you sure you want to create this entry?")}`
          }
        />
      )}
      {isConfirmationDialogOpen && (
        <ConfirmationDialog
          isOpen={isConfirmationDialogOpen}
          close={() => {
            setIsConfirmationDialogOpen(false);
            setConfirmationDialogFunction(null);
          }}
          confirm={() => {
            confirmationDialogFunction?.();
            setIsConfirmationDialogOpen(false);
            setConfirmationDialogFunction(null);
          }}
          title={confirmationDialogHeader ?? t("Create Entry")}
          text={
            confirmationDialogText ??
            `${t("Are you sure you want to create this entry?")}`
          }
        />
      )}
    </div>
  );
};

export default GenericAddEditPanel;
