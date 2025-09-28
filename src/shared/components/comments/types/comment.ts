export type CommentNote = {
  id: string;
  labelCreatedBy: string;
  labelCreatedAt: string;
  labelUpdatedBy: string;
  labelUpdatedAt: string;
  name: string;
  isActive: boolean;
};

export type CreateCommentDto = {
  name: string;
  referenceId: string;
  moduleShortcode?: string | null;
};

export type UpdateCommentDto = {
  name: string;
};
