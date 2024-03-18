import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { postWithHeader } from "../../../utils/api";
import { useGetUser, useUserMutations } from "../../../utils/api/user";
import { H4, P2 } from "../Typography";
import user1 from "../assets/profile/user-1.jpg";
import ItemContainer from "../common/ItemContainer";

export default function ProfileCard() {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState(user1);
  const { updateUser } = useUserMutations();
  const user = useGetUser();

  const uploadImageMutation = useMutation(
    async ({ file, filename }: { file: File; filename: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename);
      formData.append("foldername", "profile");

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
        setImageUrl(data.url);
        if (!user) return;
        updateUser({
          id: user._id,
          updates: { imageUrl: data.url },
        });
        toast.success(`User ${user.name} updated`);
      },
      onError: (error) => {
        console.error("Error uploading file:", error);
      },
    }
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <ItemContainer>
      <div className="flex flex-col gap-2">
        <H4>{t("Change Profile")}</H4>
        <P2>{t("Change your profile picture from here")}</P2>
      </div>
      <div className="flex flex-col gap-5 items-center">
        <img
          src={user?.imageUrl ?? imageUrl}
          alt=""
          className="w-32 h-32 rounded-full"
        />
        <div className="flex flex-row gap-4">
          <label className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto">
            {t("Upload")}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <P2>{t("Allowed JPG, GIF or PNG. Max size of 800K")}</P2>
      </div>
    </ItemContainer>
  );
}
