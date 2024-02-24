import { useMutation } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/User.context";
import { postWithHeader } from "../../../utils/api";
import { useUserMutations } from "../../../utils/api/user";
import { H4, P2 } from "../Typography";
import user1 from "../assets/profile/user-1.jpg";
import ItemContainer from "../common/ItemContainer";

const ProfileCard = () => {
  const { user } = useUserContext();
  if (!user) return <></>;
  const [imageUrl, setImageUrl] = useState(user1);
  const { updateUser } = useUserMutations();

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
        <H4>Change Profile</H4>
        <P2>Change your profile picture from here</P2>
      </div>
      <div className="flex flex-col gap-5 items-center">
        <img
          src={user?.imageUrl ?? imageUrl}
          alt=""
          className="w-32 h-32 rounded-full"
        />
        <div className="flex flex-row gap-4">
          <label className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto">
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <P2>Allowed JPG, GIF or PNG. Max size of 800K</P2>
      </div>
    </ItemContainer>
  );
};

export default ProfileCard;
