import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-toastify";
import { AxiosHeaders } from "axios";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { postWithHeader } from "../../utils/api";
import {
  useGetMonthlyActivities,
  useMonthlyActivityMutations,
} from "../../utils/api/cafeActivity";
import { MonthlyActivity } from "../../types";

const MonthlyCafeActivities = () => {
  const { t } = useTranslation();
  const monthlyActivities = useGetMonthlyActivities();
  const { createMonthlyActivity, updateMonthlyActivity, deleteMonthlyActivity } =
    useMonthlyActivityMutations();

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [monthInfo, setMonthInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState<MonthlyActivity | null>(null);
  const [editMonthInfo, setEditMonthInfo] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [rowToAction, setRowToAction] = useState<MonthlyActivity | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editPendingFile && editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPendingFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
  };

  const handleModalClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setMonthInfo("");
    setIsAddModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditModalClose = () => {
    if (editPendingFile && editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    setEditPendingFile(null);
    setRowToEdit(null);
    setIsEditModalOpen(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!pendingFile) {
      toast.error(t("Please select an image"));
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("filename", pendingFile.name);
      formData.append("foldername", "monthly-activities");
      const { url } = await postWithHeader<FormData, { url: string }>({
        path: "/asset/upload",
        payload: formData,
        headers: new AxiosHeaders({ "Content-Type": "multipart/form-data" }),
      });
      createMonthlyActivity(
        { imageUrl: url, monthInfo: monthInfo || undefined },
        {
          onSuccess: () => {
            toast.success(t("Monthly activity added"));
            handleModalClose();
          },
        }
      );
    } catch {
      toast.error(t("Image upload failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!rowToEdit) return;
    const hasChanges =
      editPendingFile !== null ||
      editMonthInfo !== (rowToEdit.monthInfo ?? "");
    if (!hasChanges) {
      handleEditModalClose();
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = rowToEdit.imageUrl;
      if (editPendingFile) {
        const formData = new FormData();
        formData.append("file", editPendingFile);
        formData.append("filename", editPendingFile.name);
        formData.append("foldername", "monthly-activities");
        const { url } = await postWithHeader<FormData, { url: string }>({
          path: "/asset/upload",
          payload: formData,
          headers: new AxiosHeaders({ "Content-Type": "multipart/form-data" }),
        });
        imageUrl = url;
      }
      updateMonthlyActivity(
        {
          id: rowToEdit._id,
          updates: {
            imageUrl,
            monthInfo: editMonthInfo || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success(t("Monthly activity updated"));
            handleEditModalClose();
          },
        }
      );
    } catch {
      toast.error(t("Image upload failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: t("Image"), isSortable: false },
      { key: t("Month Info"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const sortedMonthlyActivities = useMemo(
    () => [...(monthlyActivities ?? [])].sort((a, b) => b._id - a._id),
    [monthlyActivities]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "imageUrl",
        node: (row: MonthlyActivity) =>
          row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt="monthly activity"
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            "-"
          ),
      },
      {
        key: "monthInfo",
        node: (row: MonthlyActivity) => row.monthInfo || "-",
      },
    ],
    [t]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Monthly Calendar"),
      isModal: true,
      modal: isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold">{t("Add Monthly Calendar")}</h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
              style={{ minHeight: 180 }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-contain max-h-64" />
              ) : (
                <span className="text-gray-400 text-sm select-none py-12">{t("Click to select image")}</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{t("Month Info")}</label>
              <input
                type="text"
                value={monthInfo}
                onChange={(e) => setMonthInfo(e.target.value)}
                placeholder={t("April")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={handleModalClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                {t("Cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!pendingFile}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 disabled:opacity-40"
              >
                {t("Save")}
              </button>
            </div>
          </div>
        </div>
      ) : null,
      isModalOpen: isAddModalOpen,
      setIsModal: (val: boolean) => {
        if (!val) handleModalClose();
        else setIsAddModalOpen(true);
      },
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, previewUrl, pendingFile, monthInfo]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Edit"),
        icon: <FiEdit />,
        setRow: (row: MonthlyActivity) => {
          setRowToEdit(row);
          setEditMonthInfo(row.monthInfo ?? "");
          setEditPreviewUrl(row.imageUrl ?? null);
          setEditPendingFile(null);
        },
        modal: isEditModalOpen && rowToEdit ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
              <h2 className="text-lg font-semibold">{t("Edit Monthly Calendar")}</h2>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
                style={{ minHeight: 180 }}
                onClick={() => editFileInputRef.current?.click()}
              >
                {editPreviewUrl ? (
                  <img src={editPreviewUrl} alt="preview" className="w-full h-full object-contain max-h-64" />
                ) : (
                  <span className="text-gray-400 text-sm select-none py-12">{t("Click to select image")}</span>
                )}
              </div>
              <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditFileChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t("Month Info")}</label>
                <input
                  type="text"
                  value={editMonthInfo}
                  onChange={(e) => setEditMonthInfo(e.target.value)}
                  placeholder={t("April")}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleEditModalClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
                >
                  {t("Save")}
                </button>
              </div>
            </div>
          </div>
        ) : null,
        className: "text-blue-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            close={() => setIsDeleteDialogOpen(false)}
            confirm={() => {
              deleteMonthlyActivity(rowToAction._id);
              setIsDeleteDialogOpen(false);
            }}
            title={t("Delete Monthly Activity")}
            text={t("Monthly Activity Calendar Delete Message", { monthInfo: rowToAction.monthInfo ?? "" })}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isDeleteDialogOpen,
        setIsModal: setIsDeleteDialogOpen,
        isPath: false,
      },
    ],
    [
      t,
      rowToAction, isDeleteDialogOpen, deleteMonthlyActivity,
      rowToEdit, isEditModalOpen, editMonthInfo, editPreviewUrl, editPendingFile,
    ]
  );

  return (
    <>
      {isSubmitting && <Loading />}
      <div className="w-[98%] mx-auto mt-6 mb-2 px-2">
        <p className="text-sm text-gray-500 italic">
          {t("Monthly Activity Calendar Information Message")}
        </p>
      </div>
      <div className="w-[98%] mx-auto my-4">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          rows={sortedMonthlyActivities}
          title={t("Monthly Cafe Activities")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default MonthlyCafeActivities;
