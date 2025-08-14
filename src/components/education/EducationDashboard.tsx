import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCircleChevDown, CiCircleChevUp } from "react-icons/ci";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import {
  useEducationMutations,
  useGetEducations,
} from "../../utils/api/education";
import { useGetAllUserRoles } from "../../utils/api/user";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import Loading from "../common/Loading";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { H5 } from "../panelComponents/Typography";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { Education, RoleEnum } from "./../../types/index";
import UpdateHistory from "./UpdateHistory";

interface DraggableHeaderItemProps {
  education: Education;
  onDragEnter: (dragged: Education, target: Education) => void;
  onSelect: (id: number) => void;
}
enum ComponentTypeEnum {
  UPIMAGE = "UPIMAGE",
  LEFTIMAGE = "LEFTIMAGE",
  RIGHTIMAGE = "RIGHTIMAGE",
  DOWNIMAGE = "DOWNIMAGE",
}

const DraggableHeaderItem: React.FC<DraggableHeaderItemProps> = ({
  education,
  onDragEnter,
  onSelect,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("education", JSON.stringify(education));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData("education");
    const draggedEducation: Education = JSON.parse(draggedData);
    if (draggedEducation._id !== education._id) {
      onDragEnter(draggedEducation, education);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => onSelect(education._id)}
      className="cursor-pointer p-2 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors"
    >
      {education.header}
    </div>
  );
};

const EducationDashboard = () => {
  const { user } = useUserContext();
  const educations = useGetEducations();
  const roles = useGetAllUserRoles();
  const [isUpdateHistoryOpen, setIsUpdateHistoryOpen] = useState(false);
  const [selectedUpdateHistory, setSelectedUpdateHistory] = useState<any>(null);
  if (!user || !educations || !roles) {
    return <Loading />;
  }
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const disabledUsers = ![RoleEnum.MANAGER].includes(user?.role?._id);
  const isDisabledCondition = isEnableEdit && user ? disabledUsers : true;
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const { updateEducation, createEducation, deleteEducation } =
    useEducationMutations();
  const [isAddNewEducationModalOpen, setIsAddNewEducationModalOpen] =
    useState(false);
  const [isUpdateHeaderModalOpen, setIsUpdateHeaderModalOpen] = useState(false);
  const [headerToAction, setHeaderToAction] = useState<Education | null>(null);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [
    isSubheaderDeleteConfirmationDialogOpen,
    setIsSubheaderDeleteConfirmationDialogOpen,
  ] = useState(false);
  const [subHeaderToAction, setSubHeaderToAction] = useState<any>(null);
  const [isAddNewSubHeaderModalOpen, setIsAddNewSubHeaderModalOpen] =
    useState(false);
  const [isUpdateSubHeaderModalOpen, setIsUpdateSubHeaderModalOpen] =
    useState(false);
  const filteredEducations: Education[] =
    educations?.filter((edu: Education) =>
      isEnableEdit ? true : edu?.permissionRoles?.includes(user?.role?._id)
    ) || [];
  filteredEducations.sort((a, b) => a.order - b.order);
  const [headerForm, setHeaderForm] = useState({
    header: "",
    permissionRoles: [1],
  });
  const [updateForm, setUpdateForm] = useState({
    subHeader: "",
    paragraph: "",
    imageUrl: "",
  });
  const subHeaderInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "componentType",
      label: t("Component Type"),
      options: [
        { value: ComponentTypeEnum.UPIMAGE, label: t("Image Up") },
        { value: ComponentTypeEnum.LEFTIMAGE, label: t("Image Left") },
        { value: ComponentTypeEnum.RIGHTIMAGE, label: t("Image Right") },
        { value: ComponentTypeEnum.DOWNIMAGE, label: t("Image Down") },
      ],
      required: false,
    },
    {
      type: InputTypes.IMAGE,
      formKey: "imageUrl",
      label: "Image",
      required: false,
      folderName: "menu",
    },
    {
      type: InputTypes.TEXT,
      formKey: "subHeader",
      label: t("Sub Header"),
      placeholder: t("Sub Header"),
      required: false,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "paragraph",
      label: t("Paragraph"),
      placeholder: t("Paragraph"),
      required: false,
      inputClassName: "h-52",
    },
  ];
  const subHeaderFormKeys = [
    { key: "subHeader", type: FormKeyTypeEnum.STRING },
    { key: "paragraph", type: FormKeyTypeEnum.STRING },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    { key: "componentType", type: FormKeyTypeEnum.STRING },
  ];
  const headerInputs = [
    {
      type: InputTypes.TEXT,
      formKey: "header",
      label: t("Header"),
      placeholder: t("Header"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "permissionRoles",
      label: t("Roles"),
      options: roles?.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Roles"),
      required: true,
    },
  ];
  const headerFormKeys = [
    { key: "header", type: FormKeyTypeEnum.STRING },
    { key: "permissionRoles", type: FormKeyTypeEnum.STRING },
  ];

  const handleDragEnter = (dragged: Education, target: Education) => {
    updateEducation({
      id: dragged._id,
      updates: {
        order: target.order,
      },
    });
  };

  // Scroll smoothly to the education section on header click.
  const handleSelect = (id: number) => {
    const element = document.getElementById(`edu-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  useEffect(() => {
    setComponentKey((prevKey) => prevKey + 1);
  }, [educations, user, roles]);
  if (isUpdateHistoryOpen && selectedUpdateHistory) {
    return (
      <UpdateHistory
        updateHistory={selectedUpdateHistory}
        setIsUpdateHistoryOpen={setIsUpdateHistoryOpen}
      />
    );
  }
  return (
    <div
      key={"component" + componentKey}
      className="flex h-full flex-col sm:flex-row sm:sticky sm:top-16 "
    >
      {/* Sidebar for small screens: non-sticky, at the top */}
      <div className="sm:hidden w-full border h-max rounded-lg border-gray-200 bg-white p-2 overflow-x-auto">
        {filteredEducations.map((edu) => (
          <div
            key={edu._id}
            className="flex flex-row justify-between items-center"
          >
            <DraggableHeaderItem
              education={edu}
              onDragEnter={handleDragEnter}
              onSelect={handleSelect}
            />
            {!isDisabledCondition && (
              <HiOutlineTrash
                className="text-red-500 cursor-pointer text-xl"
                onClick={() => {
                  setHeaderToAction(edu);
                  setIsDeleteConfirmationDialogOpen(true);
                }}
              />
            )}
          </div>
        ))}
        {!isDisabledCondition && (
          <ButtonFilter
            buttonName={"+ " + t("Add New Header")}
            onclick={() => {
              setHeaderToAction(null);
              setIsAddNewEducationModalOpen(true);
            }}
          />
        )}
      </div>
      {/* Sidebar with draggable headers that stays fixed */}
      <div className="hidden sm:block w-1/4 border-r border-gray-300 p-4 sticky top-[104px]  h-full overflow-y-auto ">
        {filteredEducations.map((edu, index) => (
          <div
            key={edu._id}
            className="flex flex-row justify-between items-center"
          >
            <DraggableHeaderItem
              education={edu}
              onDragEnter={handleDragEnter}
              onSelect={handleSelect}
            />
            <div className="flex flex-row items-center gap-2">
              {edu?.updateHistory && (
                <span
                  onClick={() => {
                    if (disabledUsers) return;
                    setSelectedUpdateHistory(edu?.updateHistory);
                    setIsUpdateHistoryOpen(true);
                  }}
                  className={`text-xs text-gray-500 ${
                    !disabledUsers && "cursor-pointer hover:text-blue-500"
                  }`}
                >
                  {edu.updateHistory.length > 0
                    ? format(
                        new Date(
                          edu.updateHistory.reduce((latest, curr) =>
                            new Date(curr.updatedAt) >
                            new Date(latest.updatedAt)
                              ? curr
                              : latest
                          ).updatedAt
                        ),
                        "dd-MM-yyyy"
                      )
                    : edu?.createdAt
                    ? format(edu?.createdAt, "dd-MM-yyyy")
                    : ""}
                </span>
              )}
              {!isDisabledCondition && (
                <HiOutlineTrash
                  className="text-red-500 cursor-pointer text-xl  "
                  onClick={() => {
                    setHeaderToAction(edu);
                    setIsDeleteConfirmationDialogOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        ))}
        {!isDisabledCondition && (
          <ButtonFilter
            buttonName={"+ " + t("Add New Header")}
            onclick={() => {
              setHeaderToAction(null);
              setIsAddNewEducationModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Main content area showing education details */}
      <div className="sm:w-3/4 p-2 sm:p-4 overflow-y-auto h-full">
        {!disabledUsers && (
          <div className="w-fit ml-auto flex flex-row gap-2">
            <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
            <H5 className="w-fit">{t("Enable Edit")}</H5>
          </div>
        )}
        {filteredEducations?.map((edu, index) => (
          <section
            key={edu._id}
            id={`edu-${edu._id}`}
            className=" scroll-mt-16 p-4"
          >
            <div className="flex flex-row gap-2 items-center">
              <h2
                className={`text-2xl font-bold ${
                  !isDisabledCondition && "cursor-pointer"
                } `}
                onClick={() => {
                  if (isDisabledCondition) return;
                  setHeaderToAction(edu);
                  setIsUpdateHeaderModalOpen(true);
                }}
              >
                {edu.header}
              </h2>
              {!isDisabledCondition && (
                <div className="flex flex-row items-center gap-4">
                  <button
                    className="px-2 text-sm bg-blue-500 hover:text-blue-500 hover:border-blue-500  py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
                    onClick={() => {
                      setHeaderToAction(edu);
                      setSubHeaderToAction(null);
                      setIsAddNewSubHeaderModalOpen(true);
                    }}
                  >
                    <H5> {"+ " + t("Add New Sub Header")}</H5>
                  </button>
                  <div className="flex flex-row items-center gap-2">
                    {edu?.permissionRoles?.map((roleId) => {
                      const role = roles?.find((role) => role._id === roleId);
                      return (
                        <span
                          key={roleId}
                          className={` text-white px-2 py-1 rounded-md text-xs`}
                          style={{ backgroundColor: role?.color }}
                        >
                          {role?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {edu.subheaders
              ?.sort((a, b) => a.order - b.order)
              ?.map((sub, index) => (
                <div key={index} className="mb-4">
                  <div className="flex flex-row gap-1 items-center w-fit">
                    {!isDisabledCondition && index !== 0 && (
                      <CiCircleChevUp
                        className="text-green-500 cursor-pointer text-2xl "
                        onClick={() => {
                          const targetOrder = sub.order - 1;
                          const updatedSubheaders = (edu.subheaders || []).map(
                            (subHeader) => {
                              if (subHeader.order === sub.order) {
                                return {
                                  ...subHeader,
                                  order: targetOrder,
                                };
                              }
                              if (subHeader.order === targetOrder) {
                                return {
                                  ...subHeader,
                                  order: sub.order,
                                };
                              }
                              return subHeader;
                            }
                          );
                          updateEducation({
                            id: edu._id,
                            updates: {
                              subheaders: updatedSubheaders,
                            },
                          });
                        }}
                      />
                    )}
                    {sub.subHeader && (
                      <h3
                        onClick={() => {
                          if (isDisabledCondition) return;
                          setHeaderToAction(edu);
                          setSubHeaderToAction(sub);
                          setIsUpdateSubHeaderModalOpen(true);
                        }}
                        className={`text-lg font-semibold ${
                          !isDisabledCondition && "cursor-pointer"
                        }`}
                      >
                        {sub.subHeader}
                      </h3>
                    )}
                    {!isDisabledCondition &&
                      index !== (edu?.subheaders?.length ?? 0) - 1 &&
                      (edu.subheaders?.length ?? 0) > 1 && (
                        <CiCircleChevDown
                          className="text-red-500 cursor-pointer text-2xl ml-auto"
                          onClick={() => {
                            const targetOrder = sub.order + 1;
                            const updatedSubheaders = (
                              edu.subheaders || []
                            ).map((subHeader) => {
                              if (subHeader.order === sub.order) {
                                return {
                                  ...subHeader,
                                  order: targetOrder,
                                };
                              }
                              if (subHeader.order === targetOrder) {
                                return {
                                  ...subHeader,
                                  order: sub.order,
                                };
                              }
                              return subHeader;
                            });
                            updateEducation({
                              id: edu._id,
                              updates: {
                                subheaders: updatedSubheaders,
                              },
                            });
                          }}
                        />
                      )}
                    {!isDisabledCondition && (
                      <HiOutlineTrash
                        className="text-red-500 cursor-pointer text-xl  "
                        onClick={() => {
                          setHeaderToAction(edu);
                          setSubHeaderToAction(sub);
                          setIsSubheaderDeleteConfirmationDialogOpen(true);
                        }}
                      />
                    )}
                  </div>
                  <div
                    className={`w-full flex gap-2 ${
                      [
                        ComponentTypeEnum.UPIMAGE,
                        ComponentTypeEnum.DOWNIMAGE,
                      ].includes(sub?.componentType as ComponentTypeEnum)
                        ? "flex-col"
                        : (sub?.componentType as ComponentTypeEnum) ===
                            ComponentTypeEnum.LEFTIMAGE ||
                          (sub?.componentType as ComponentTypeEnum) ===
                            ComponentTypeEnum.RIGHTIMAGE
                        ? "flex-row"
                        : ""
                    }`}
                  >
                    {/* Image First (UP or LEFT) */}
                    {sub.imageUrl &&
                      [
                        ComponentTypeEnum.UPIMAGE,
                        ComponentTypeEnum.LEFTIMAGE,
                      ].includes(sub?.componentType as ComponentTypeEnum) && (
                        <img
                          src={sub.imageUrl}
                          alt={sub.subHeader}
                          className={`object-contain ${
                            [
                              ComponentTypeEnum.LEFTIMAGE,
                              ComponentTypeEnum.RIGHTIMAGE,
                            ].includes(sub?.componentType as ComponentTypeEnum)
                              ? "w-64 h-auto"
                              : "w-[60%] h-96 mx-auto"
                          }`}
                        />
                      )}

                    {/* Paragraph */}
                    {sub.paragraph && (
                      <p
                        onClick={() => {
                          if (isDisabledCondition) return;
                          setHeaderToAction(edu);
                          setSubHeaderToAction(sub);
                          setIsUpdateSubHeaderModalOpen(true);
                        }}
                        className={`${
                          [
                            ComponentTypeEnum.LEFTIMAGE,
                            ComponentTypeEnum.RIGHTIMAGE,
                          ].includes(sub?.componentType as ComponentTypeEnum)
                            ? "flex-1"
                            : ""
                        }`}
                      >
                        {sub?.paragraph &&
                          sub?.paragraph?.split("\n")?.map((line, idx, arr) => (
                            <React.Fragment key={idx}>
                              {line}
                              {idx < arr.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                      </p>
                    )}

                    {/* Image Last (DOWN or RIGHT) */}
                    {sub.imageUrl &&
                      [
                        ComponentTypeEnum.DOWNIMAGE,
                        ComponentTypeEnum.RIGHTIMAGE,
                      ].includes(sub?.componentType as ComponentTypeEnum) && (
                        <img
                          src={sub.imageUrl}
                          alt={sub.subHeader}
                          className={`object-contain ${
                            [
                              ComponentTypeEnum.LEFTIMAGE,
                              ComponentTypeEnum.RIGHTIMAGE,
                            ].includes(sub?.componentType as ComponentTypeEnum)
                              ? "w-64 h-auto"
                              : "w-[60%] h-96 mx-auto"
                          }`}
                        />
                      )}
                  </div>
                </div>
              ))}
          </section>
        ))}
      </div>
      {(isAddNewEducationModalOpen || isUpdateHeaderModalOpen) && (
        <GenericAddEditPanel
          isOpen={isAddNewEducationModalOpen || isUpdateHeaderModalOpen}
          close={() => {
            setIsAddNewEducationModalOpen(false);
            setIsUpdateHeaderModalOpen(false);
          }}
          inputs={headerInputs}
          formKeys={headerFormKeys}
          submitItem={createEducation as any}
          setForm={setHeaderForm}
          constantValues={{ ...headerToAction }}
          submitFunction={() => {
            if (isUpdateHeaderModalOpen && headerToAction) {
              updateEducation({
                id: headerToAction._id,
                updates: {
                  ...headerForm,
                },
              });
            } else if (isAddNewEducationModalOpen) {
              createEducation({
                ...headerForm,
                order: educations?.length ?? 0,
              });
            }
          }}
          topClassName="flex flex-col gap-2 "
        />
      )}

      {(isAddNewSubHeaderModalOpen || isUpdateSubHeaderModalOpen) &&
        headerToAction && (
          <GenericAddEditPanel
            isOpen={isAddNewSubHeaderModalOpen || isUpdateSubHeaderModalOpen}
            close={() => {
              setIsAddNewSubHeaderModalOpen(false);
              setIsUpdateSubHeaderModalOpen(false);
            }}
            inputs={subHeaderInputs}
            formKeys={subHeaderFormKeys}
            submitItem={updateEducation as any}
            setForm={setUpdateForm}
            constantValues={{ ...subHeaderToAction }}
            submitFunction={() => {
              if (isAddNewSubHeaderModalOpen && headerToAction) {
                updateEducation({
                  id: headerToAction._id,
                  updates: {
                    subheaders: [
                      ...(headerToAction.subheaders || []),
                      {
                        ...updateForm,
                        order: headerToAction.subheaders?.length ?? 0,
                      },
                    ],
                  },
                });
              } else if (isUpdateSubHeaderModalOpen && subHeaderToAction) {
                updateEducation({
                  id: headerToAction._id,
                  updates: {
                    subheaders: [
                      ...(headerToAction.subheaders || []).map((sub) => {
                        if (sub.order === subHeaderToAction.order) {
                          return { ...sub, ...updateForm };
                        }
                        return sub;
                      }),
                    ],
                  },
                });
              }
            }}
            topClassName="flex flex-col gap-2  "
            generalClassName=" overflow-visible  no-scrollbar"
          />
        )}
      {isDeleteConfirmationDialogOpen && headerToAction && (
        <ConfirmationDialog
          isOpen={isDeleteConfirmationDialogOpen}
          close={() => setIsDeleteConfirmationDialogOpen(false)}
          confirm={() => {
            deleteEducation(headerToAction?._id);
            setIsDeleteConfirmationDialogOpen(false);
          }}
          title={t("Delete Header")}
          text={`${headerToAction.header} ${t("GeneralDeleteMessage")}`}
        />
      )}
      {isSubheaderDeleteConfirmationDialogOpen &&
        subHeaderToAction &&
        headerToAction && (
          <ConfirmationDialog
            isOpen={isSubheaderDeleteConfirmationDialogOpen}
            close={() => setIsSubheaderDeleteConfirmationDialogOpen(false)}
            confirm={() => {
              const updatedSubheaders = (headerToAction.subheaders || [])
                .filter((sub) => sub.order !== subHeaderToAction.order)
                .sort((a, b) => a.order - b.order)
                .map((sub, index) => ({
                  ...sub,
                  order: index,
                }));
              updateEducation({
                id: headerToAction._id,
                updates: {
                  subheaders: updatedSubheaders,
                },
              });
              setIsSubheaderDeleteConfirmationDialogOpen(false);
            }}
            title={t("Delete Subheader")}
            text={`${subHeaderToAction?.subheader ?? "Subheader"} ${t(
              "GeneralDeleteMessage"
            )}`}
          />
        )}
    </div>
  );
};

export default EducationDashboard;
