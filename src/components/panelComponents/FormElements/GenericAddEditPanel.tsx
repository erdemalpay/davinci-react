import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { useCallback, useEffect, useState } from "react";
import { ActionMeta, SingleValue } from "react-select";
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
  constantValues?: { [key: string]: any };
  isEditMode?: boolean;
  itemToEdit?: {
    id: number;
    updates: T;
  };
};
type FormElementsState = {
  [key: string]: any; // this is the type of the form elements it can be string, number, boolean, etc.
};

const GenericAddEditPanel = <T,>({
  isOpen,
  close,
  inputs,
  formKeys,
  topClassName,
  constantValues,
  isEditMode = false,
  itemToEdit,
  submitItem,
}: Props<T>) => {
  const [imageFormKey, setImageFormKey] = useState<string>("");
  const imageInputs = inputs.filter((input) => input.type === InputTypes.IMAGE);
  const nonImageInputs = inputs.filter(
    (input) => input.type !== InputTypes.IMAGE
  );
  const [formElements, setFormElements] = useState(() => {
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
          //  TODO: Add more types
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

  useEffect(() => {
    if (isEditMode && itemToEdit) {
      setFormElements(itemToEdit.updates as unknown as FormElementsState);
    }
  }, [itemToEdit, isEditMode]);
  const uploadImageMutation = useMutation(
    async ({
      file,
      filename,
      foldername,
    }: {
      file: File;
      filename: string;
      foldername: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename);
      formData.append("foldername", foldername);

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

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, input: GenericInputType) => {
      setImageFormKey(input.formKey);
      if (event.target.files?.[0]) {
        const file = event.target.files[0];
        const filename = file.name;
        uploadImageMutation.mutate({
          file,
          filename,
          foldername: input.folderName ?? "forgotten",
        });
      }
    },
    [uploadImageMutation]
  );
  const handleSubmit = () => {
    try {
      if (isEditMode && itemToEdit) {
        submitItem({ id: itemToEdit.id, updates: formElements as T });
      } else {
        submitItem(formElements as T);
      }
      setFormElements({});
      close();
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };
  return (
    <div
      className={`fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-0 ${
        !isOpen && "hidden"
      }`}
    >
      <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-2/5 2xl:w-2/5 z-20 ">
        <div className=" rounded-tl-md rounded-tr-md  md:px-8 md:py-8 py-10 flex flex-col gap-4 justify-between ">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${topClassName}`}
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
                  />
                  <label
                    key={input.formKey}
                    className="w-fit ml-auto inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto border-b sm:border-b-0"
                  >
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, input)}
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
                  setFormElements((prev) => ({ ...prev, [key]: value }));
                };
                const handleChangeForSelect =
                  (key: string) =>
                  (
                    value: SingleValue<{ value: string; label: string }>,
                    actionMeta: ActionMeta<{ value: string; label: string }>
                  ) => {
                    if (
                      actionMeta.action === "select-option" ||
                      actionMeta.action === "remove-value"
                    ) {
                      setFormElements((prev) => ({
                        ...prev,
                        [key]: value?.value,
                      })); // Only storing the value for simplicity
                    }
                  };
                return (
                  <div key={input.formKey} className="flex flex-col gap-2">
                    {(input.type === InputTypes.TEXT ||
                      input.type === InputTypes.NUMBER ||
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
                        key={input.formKey}
                        value={value}
                        label={input.label ?? ""}
                        options={input.options ?? []}
                        placeholder={input.placeholder ?? ""}
                        onChange={handleChangeForSelect(input.formKey)}
                      />
                    )}
                    {input.type === InputTypes.TEXTAREA && (
                      <div className="flex flex-col gap-2" key={input.formKey}>
                        <H6>{input.label}</H6>

                        <textarea
                          value={value}
                          onChange={(e) =>
                            handleChange(input.formKey)(e.target.value)
                          }
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
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit "
            >
              {isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericAddEditPanel;
