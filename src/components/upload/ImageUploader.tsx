import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import React, { useCallback, useState } from "react";
import { postWithHeader } from "../../utils/api";

interface ImageUploaderProps {
  initialImageUrl: string;
  filename: string;
  foldername: string;
  onSuccessCallback: (url: string) => void;
}

interface UploadResponse {
  url: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  initialImageUrl,
  filename,
  foldername,
  onSuccessCallback,
}) => {
  // State for the image URL
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);

  // Mutation for uploading the file
  const uploadImageMutation = useMutation<
    UploadResponse,
    Error,
    { file: File; filename: string; foldername: string }
  >(
    async ({
      file,
      filename: testname,
      foldername,
    }: {
      file: File;
      filename: string;
      foldername: string;
    }) => {
      // Initialize FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", testname);
      formData.append("foldername", foldername);

      // Post the form data to the upload endpoint
      const res = await postWithHeader<FormData, UploadResponse>({
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
        // Assuming the response contains the URL to the uploaded image
        console.log({ data });
        setImageUrl(data.url);
        onSuccessCallback(data.url);
      },
      onError: (error) => {
        console.log({ error });
        console.error("Error uploading file:", error);
      },
    }
  );

  // function startEditing(publicId: string) {
  //   const myEditor = cloudinary.mediaEditor();

  //   myEditor.update({
  //     cloudName: "dvbg",
  //     publicIds: [publicId],
  //   });
  //   myEditor.show();
  // }

  // Function called when the file input changes (file selected)
  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.[0]) {
        uploadImageMutation.mutate({
          file: event.target.files[0],
          filename,
          foldername,
        });
      }
    },
    [uploadImageMutation]
  );

  return (
    <div>
      {/* Display the image */}
      <img
        src={imageUrl}
        alt="Upload"
        onClick={() =>
          document.getElementById(`image-upload-${filename}`)?.click()
        }
        style={{ cursor: "pointer" }}
        width="150"
      />

      {/* Hidden file input */}
      <input
        type="file"
        id={`image-upload-${filename}`}
        style={{ display: "none" }}
        onChange={onFileChange}
        accept="image/*" // Accept images only
      />

      {/* Display upload status */}
      {uploadImageMutation.isLoading && <p>Uploading...</p>}
      {uploadImageMutation.isError && <p>Error uploading image.</p>}
      {uploadImageMutation.isSuccess && <p>Upload successful!</p>}
    </div>
  );
};

export default ImageUploader;
