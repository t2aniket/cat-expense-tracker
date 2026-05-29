import type { Category } from "@/types/domain";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", color: "#2F80ED", icon: "Bowl", isDefault: true, isFavorite: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "wet-food", name: "Wet Food", color: "#00A676", icon: "Droplets", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "dry-food", name: "Dry Food", color: "#8E6C88", icon: "Package", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "treats", name: "Treats", color: "#F2994A", icon: "Cookie", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "litter", name: "Litter", color: "#6C757D", icon: "Box", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "vet", name: "Vet", color: "#EB5757", icon: "Stethoscope", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "medicine", name: "Medicine", color: "#9B51E0", icon: "Pill", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "vaccination", name: "Vaccination", color: "#27AE60", icon: "Syringe", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "grooming", name: "Grooming", color: "#56CCF2", icon: "Scissors", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "toys", name: "Toys", color: "#F2C94C", icon: "Sparkles", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "travel", name: "Travel", color: "#2D9CDB", icon: "Car", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "miscellaneous", name: "Miscellaneous", color: "#4F4F4F", icon: "MoreHorizontal", isDefault: true, isFavorite: false, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }
];

export const CATEGORY_COLORS = ["#2F80ED", "#00A676", "#F2994A", "#EB5757", "#9B51E0", "#56CCF2", "#F2C94C", "#6C757D"];
