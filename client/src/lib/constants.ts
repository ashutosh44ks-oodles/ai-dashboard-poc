import {
  IconDashboard,
  IconDatabase,
  IconHelp,
  IconSettings,
} from "@tabler/icons-react";

export const lightTheme = {
  defaultChartPalette: ["#4F46E5", "#22C55E", "#F97316", "#06B6D4", "#EC4899"],
  barChartPalette: ["#6366F1", "#34D399", "#FB923C", "#7DD3FC", "#F9A8D4"],
  lineChartPalette: ["#3B82F6", "#10B981", "#F59E0B", "#0EA5E9", "#E879F9"],
  areaChartPalette: ["#93C5FD", "#6EE7B7", "#FDE68A", "#BAE6FD", "#A78BFA"],
  pieChartPalette: ["#A5B4FC", "#22C55E", "#0EA5E9", "#F97316", "#ff1717"],
  radarChartPalette: ["#818CF8", "#4ADE80", "#FBBF24", "#5EEAD4", "#E9D5FF"],
  radialChartPalette: ["#60A5FA", "#22D3EE", "#FACC15", "#A78BFA", "#FCA5A5"],
};

export interface Widget {
  id: string;
  user_id: number;
  prompt: string;
  sql_query: string | null;
  content: string | null;
  created_at: Date;
}

export const SIDEBAR_STRUCTURE = {
  navMain: [
    {
      title: "Dashboard",
      id: "dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Data Models",
      id: "data-models",
      url: "/data-models",
      icon: IconDatabase,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      id: "settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      id: "get-help",
      url: "#",
      icon: IconHelp,
    },
  ],
};

export interface APIResponse<T> {
  success: true;
  data?: T;
  error?: unknown;
}

export interface ApiResponsePageable<T> extends Omit<APIResponse<T>, "data"> {
  data?: {
    content: T[];
    totalElements: number;
  };
}
