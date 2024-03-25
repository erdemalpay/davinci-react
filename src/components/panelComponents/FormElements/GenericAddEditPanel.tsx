import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { toast } from "react-toastify";
import { NO_IMAGE_URL } from "../../../navigation/constants";
import { UpdatePayload, postWithHeader } from "../../../utils/api";
import { H6 } from "../Typography";

import {
  FormKeyType,
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../shared/types";
import SelectInput from "./SelectInput";
import TextInput from "./TextInput";

type Props<T> = {
  isOpen: boolean;
  close: () => void;
  inputs: GenericInputType[];
  formKeys: FormKeyType[];
  topClassName?: string;
  submitItem: (item: T | UpdatePayload<T>) => void;
  setForm?: (item: T) => void;
  handleUpdate?: () => void;

  constantValues?: { [key: string]: any };
  isEditMode?: boolean;
  folderName?: string;
  buttonName?: string;
  itemToEdit?: {
    id: number | string;
    updates: T;
  };
};
type OptionType = { value: string; label: string };

type FormElementsState = {
  [key: string]: any; // this is the type of the form elements it can be string, number, boolean, etc.
};

const GenericAddEditPanel = <T,>({
  isOpen,
  close,
  inputs,
  formKeys,
  topClassName,
  buttonName,
  constantValues,
  isEditMode = false,
  itemToEdit,
  folderName,
  handleUpdate,
  setForm,

  submitItem,
}: Props<T>) => {
  const { t } = useTranslation();
  const [allRequiredFilled, setAllRequiredFilled] = useState(false);
  const [imageFormKey, setImageFormKey] = useState<string>("");
  const imageInputs = inputs.filter((input) => input.type === InputTypes.IMAGE);
  const nonImageInputs = inputs.filter(
    (input) => input.type !== InputTypes.IMAGE
  );
  const [formElements, setFormElements] = useState(() => {
    if (isEditMode && itemToEdit) {
      return itemToEdit.updates as unknown as FormElementsState;
    }
    const initialState = formKeys.reduce<FormElementsState>(
      (acc, { key, type }) => {
        let defaultValue;
        switch (type) {
          case FormKeyTypeEnum.STRING:
            defaultValue = "";
            break;
          case FormKeyTypeEnum.NUMBER:
            defaultValue = 0;
            break;
          case FormKeyTypeEnum.BOOLEAN:
            defaultValue = false;
            break;
          case FormKeyTypeEnum.DATE:
            defaultValue = new Date();
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

    return mergedInitialState;
  });

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
  useEffect(() => {
    setForm && setForm(formElements as T);
    setAllRequiredFilled(areRequiredFieldsFilled());
  }, [formElements, inputs]);

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
  const handleSubmit = () => {
    try {
      if (isEditMode && itemToEdit) {
        submitItem({ id: itemToEdit.id, updates: formElements as T });
      } else if (isEditMode && handleUpdate) {
        handleUpdate();
      } else {
        submitItem(formElements as T);
      }
      setFormElements({});
      close();
    } catch (error) {
      console.error("Failed to execute submit item:", error);
    }
  };

  const areRequiredFieldsFilled = () => {
    return inputs.every((input) => {
      if (!input.required) return true;
      const value = formElements[input.formKey];
      return value !== undefined && value !== null && value !== "";
    });
  };

  return (
    <div
      className={`__className_a182b8 fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ${
        !isOpen && "hidden"
      }`}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-md shadow-lg  w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 max-w-full max-h-[90vh] z-[100] overflow-visible overflow-scroll"
      >
        <div className="rounded-tl-md rounded-tr-md px-4 py-6 flex flex-col gap-4 justify-between">
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
            <div className="flex flex-col gap-4">
              {/* nonimage inputs */}
              {nonImageInputs.map((input) => {
                const value = formElements[input.formKey];
                const handleChange = (key: string) => (value: string) => {
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
                  setFormElements((prev) => ({ ...prev, [key]: value }));
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
                      actionMeta.action === "select-option" ||
                      actionMeta.action === "remove-value" ||
                      actionMeta.action === "clear"
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

                return (
                  <div key={input.formKey} className="flex flex-col gap-2">
                    {(input.type === InputTypes.TEXT ||
                      input.type === InputTypes.NUMBER ||
                      input.type === InputTypes.DATE ||
                      input.type === InputTypes.TIME ||
                      input.type === InputTypes.COLOR ||
                      input.type === InputTypes.PASSWORD) && (
                      <TextInput
                        key={input.formKey}
                        type={input.type}
                        value={value}
                        label={input.label ?? ""}
                        placeholder={input.placeholder ?? ""}
                        onChange={handleChange(input.formKey)}
                      />
                    )}

                    {input.type === InputTypes.SELECT && (
                      <SelectInput
                        key={
                          input.isMultiple
                            ? input.formKey
                            : input.formKey + formElements[input.formKey]
                        }
                        value={input.options?.find(
                          (option) =>
                            option.value === formElements[input.formKey]
                        )}
                        label={input.label ?? ""}
                        options={input.options ?? []}
                        placeholder={input.placeholder ?? ""}
                        isMultiple={input.isMultiple ?? false}
                        onChange={handleChangeForSelect(input.formKey)}
                      />
                    )}
                    {input.type === InputTypes.TEXTAREA && (
                      <div className="flex flex-col gap-2" key={input.formKey}>
                        <H6>{input.label}</H6>

                        <textarea
                          value={value}
                          onChange={(e) => {
                            handleChange(input.formKey)(e.target.value);
                          }}
                          placeholder={input.placeholder ?? ""}
                          className="border border-gray-300 rounded-md p-2"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="ml-auto flex flex-row gap-4">
            <button
              onClick={close}
              className="inline-block bg-red-400 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit"
            >
              {t("Cancel")}
            </button>
            <button
              onClick={() => {
                if (!allRequiredFilled) {
                  toast.error("Please fill all required fields");
                } else {
                  const phoneValidationFailed = inputs
                    .filter((input) => input.additionalType === "phone")
                    .some((input) => {
                      const inputValue = formElements[input.formKey];
                      if (!inputValue.match(/^[0-9]{11}$/)) {
                        toast.error("Check phone number.");
                        return true; // Validation failed for phone number
                      }
                      return false; // Validation passed for phone number
                    });

                  if (!phoneValidationFailed) {
                    handleSubmit();
                  }
                }
              }}
              className={`inline-block ${
                !allRequiredFilled
                  ? "bg-gray-500"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit`}
            >
              {buttonName ? buttonName : isEditMode ? t("Update") : t("Create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericAddEditPanel;
