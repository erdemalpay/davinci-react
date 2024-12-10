import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { FaImages } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { postWithHeader } from "../../utils/api";
import { useGetFolderNames } from "../../utils/api/asset";
import SelectInput from "../panelComponents/FormElements/SelectInput";

type OptionType = { value: number; label: string };

interface FileWithPreview extends File {
  preview: string;
}

const ImageUpload = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderNames = useGetFolderNames();
  const [selectedFolder, setSelectedFolder] = useState("");
  if (!folderNames) return <></>;

  const uploadImagesMutation = useMutation<any, Error, FileWithPreview[]>(
    async (filesWithPreviews) => {
      if (selectedFolder === "" || !selectedFolder) {
        toast.error(t("Please select a folder to upload images"));
        return;
      }
      const formData = new FormData();
      filesWithPreviews.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("foldername", selectedFolder);
      const response = await postWithHeader<FormData, any>({
        path: "/asset/uploads",
        payload: formData,
        headers: new AxiosHeaders({
          "Content-Type": "multipart/form-data",
        }),
      });
      return response;
    },
    {
      onSuccess: () => {
        if (selectedFolder === "" || !selectedFolder) {
          return;
        }
        setFiles([]);
      },
      onError: (error) => console.error("Error uploading files:", error),
    }
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    ) as FileWithPreview[];

    setFiles((prevFiles) => [...prevFiles, ...filesWithPreview]);
  }, []);

  const removeFile = (fileName: string) => {
    const newFiles = files.filter((f) => f.name !== fileName);
    setFiles(newFiles);
    const fileToRemove = files.find((f) => f.name === fileName);
    if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = () => {
    uploadImagesMutation.mutate(files);
  };

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-4 bg-white rounded-lg my-6 __className_a182b8">
      <h1 className="font-bold text-xl text-gray-800">{t("Media")}</h1>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #ccc",
          position: "relative",
          borderRadius: "10px",
        }}
      >
        <input {...getInputProps()} ref={inputRef} />
        <div className="flex flex-col gap-4 items-center px-8 py-10">
          <FaImages size={30} className="text-blue-700" />
          <p className="text-sm font-medium text-gray-800">
            {t("Drag and drop or")}{" "}
            <span
              className="text-blue-700 cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              {t("select from device")}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {t("File type")}: .jpg, .jpeg, .png / {t("Max file size")}: 50MB
          </p>
        </div>
        <div className="flex flex-row gap-2 justify-center mr-2">
          <div className="sm:w-1/4 px-4">
            <SelectInput
              options={folderNames?.map((folder) => ({
                value: folder,
                label: folder,
              }))}
              isMultiple={false}
              value={
                selectedFolder
                  ? {
                      value: selectedFolder,
                      label: selectedFolder,
                    }
                  : null
              }
              isOnClearActive={false}
              onChange={(selectedOption) => {
                setSelectedFolder(
                  String((selectedOption as OptionType)?.value)
                );
              }}
              placeholder={t("Select a folder")}
            />
          </div>
          <button
            onClick={handleUpload}
            className="px-2 mt-auto sm:px-3 py-1 h-fit w-fit text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer  bg-blue-500 hover:text-blue-500 hover:border-blue-500"
          >
            {t("Upload")}
          </button>
        </div>

        <div className="flex flex-col gap-5 p-3">
          <h1 className="font-bold text-xl text-gray-800">
            {t("Uploaded Images")}
          </h1>
          <div className="flex flex-wrap gap-4">
            {files.map((file) => (
              <div key={file.name} style={{ position: "relative" }}>
                <img
                  src={file.preview}
                  alt={file.name}
                  className="rounded-md border border-gray-200 w-60 h-72 relative"
                />
                <button
                  onClick={() => removeFile(file.name)}
                  className="bg-white rounded-md p-2.5 border border-gray-200"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    cursor: "pointer",
                  }}
                >
                  <RiDeleteBinLine size={20} className="text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
