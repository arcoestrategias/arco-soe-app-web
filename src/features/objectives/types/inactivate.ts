export type ObjectiveAssociationItem = {
  id: string;
  name: string;
  status?: string | null;
  fromAt?: string | null;
  untilAt?: string | null;
  isActive?: boolean | null;
};

export type InactivateObjectiveResult = {
  blocked: boolean;
  message?: string;
  associations?: {
    projects?: ObjectiveAssociationItem[];
    priorities?: ObjectiveAssociationItem[];
  };
};
