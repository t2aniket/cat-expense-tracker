export type Expense = {
  id: string;
  projectId?: string;
  amount: number;
  category: string;
  paidByUserId?: string;
  paidByName?: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  projectId?: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  theme: "light" | "dark" | "system";
  lastCategory: string;
  favoriteCategory: string;
  budgetMonthly: number;
  budgetAlertPercent: number;
  quickAmounts: number[];
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  image: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  role: "owner" | "admin" | "member" | "viewer";
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInvite = {
  id: string;
  projectId: string;
  projectName: string;
  email: string;
  role: Project["role"];
  status: "pending" | "accepted" | "declined";
  invitedByName: string;
  createdAt: string;
};

export type ProjectMember = {
  projectId: string;
  userId: string;
  name: string;
  email: string;
  image: string;
  role: Project["role"];
  joinedAt: string;
};

export type SortMode = "latest" | "oldest" | "highest" | "lowest";

export type DateRange = {
  from: string;
  to: string;
};
