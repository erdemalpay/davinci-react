import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { patch, post, remove } from ".";
import { Paths, useGet } from "./factory";

export enum AssignmentTypeEnum {
  GAME_LEARNING = "game_learning",
  INVENTORY_COUNT = "inventory_count",
  CHECKLIST = "checklist",
  REVIEW = "review",
  TRAINING = "training",
  INSPECTION = "inspection",
  GENERAL = "general",
}

export enum AssignmentStatusEnum {
  DRAFT = "draft",
  ASSIGNED = "assigned",
  ACCEPTED = "accepted",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

export enum AssignmentPriorityEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface AssignmentSubjectDto {
  entityType: string;
  entityId: string;
}

export interface Assignment {
  _id: number;
  title: string;
  description?: string;
  assignmentType: AssignmentTypeEnum;
  assignedBy: string;
  assignedTo: string;
  subject?: AssignmentSubjectDto;
  dueDate?: Date | string;
  status: AssignmentStatusEnum;
  priority: AssignmentPriorityEnum;
  payload: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string;
  cancelledAt?: Date | string;
}

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  assignmentType: AssignmentTypeEnum;
  assignedBy: string;
  assignedTo: string;
  subject?: AssignmentSubjectDto;
  dueDate?: Date | string;
  status?: AssignmentStatusEnum;
  priority?: AssignmentPriorityEnum;
  payload?: Record<string, unknown>;
}

export type UpdateAssignmentDto = Partial<CreateAssignmentDto>;

export interface AssignmentQueryDto {
  search?: string;
  assignmentType?: AssignmentTypeEnum | AssignmentTypeEnum[];
  status?: AssignmentStatusEnum | AssignmentStatusEnum[];
  priority?: AssignmentPriorityEnum | AssignmentPriorityEnum[];
  assignedBy?: string;
  assignedTo?: string;
  subjectEntityType?: string;
  subjectEntityId?: string;
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
  sort?: string;
  asc?: number;
}

export interface AssignmentsPayload {
  data: Assignment[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

const baseUrl = Paths.Assignments;

function buildQueryString(filters: AssignmentQueryDto = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}

export function useGetAssignments(
  page: number,
  limit: number,
  filters: AssignmentQueryDto = {}
) {
  const queryString = buildQueryString({ ...filters, page, limit });
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  return useGet<AssignmentsPayload>(url, [baseUrl, page, limit, filters], true);
}

export function useGetAssignment(id?: string | number) {
  return useGet<Assignment>(`${baseUrl}/${id}`, [baseUrl, id], true, {
    enabled: !!id,
  });
}

function createAssignment(payload: CreateAssignmentDto): Promise<Assignment> {
  return post<CreateAssignmentDto, Assignment>({
    path: baseUrl,
    payload,
  });
}

function updateAssignmentRequest({
  id,
  updates,
}: {
  id: number | string;
  updates: UpdateAssignmentDto;
}): Promise<Assignment> {
  return patch<UpdateAssignmentDto, Assignment>({
    path: `${baseUrl}/${id}`,
    payload: updates,
  });
}

function deleteAssignment(id: number | string): Promise<Assignment> {
  return remove<Assignment>({
    path: `${baseUrl}/${id}`,
  });
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    const message = response?.data?.message;
    if (typeof message === "string") return message;
  }

  return "An unexpected error occurred";
}

export function useAssignmentMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const invalidateAssignments = () =>
    queryClient.invalidateQueries({ queryKey: [baseUrl] });

  const createMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: invalidateAssignments,
    onError: (error: unknown) => {
      setTimeout(() => toast.error(t(extractErrorMessage(error))), 200);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAssignmentRequest,
    onSuccess: invalidateAssignments,
    onError: (error: unknown) => {
      setTimeout(() => toast.error(t(extractErrorMessage(error))), 200);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: invalidateAssignments,
    onError: (error: unknown) => {
      setTimeout(() => toast.error(t(extractErrorMessage(error))), 200);
    },
  });

  return {
    createAssignment: createMutation.mutate,
    updateAssignment: updateMutation.mutate,
    deleteAssignment: deleteMutation.mutate,
    createAssignmentAsync: createMutation.mutateAsync,
    updateAssignmentAsync: updateMutation.mutateAsync,
    deleteAssignmentAsync: deleteMutation.mutateAsync,
  };
}
