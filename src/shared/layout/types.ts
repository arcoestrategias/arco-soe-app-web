export interface SidebarProps {
  currentPath?: string;
  onLogout?: () => void;
  onToggle?: (isCollapsed: boolean) => void;
  onNavigate?: (url: string) => void;
}

export interface HeaderProps {
  currentPageTitle?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
}

export interface SidebarLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  pageTitle?: string;
  onNavigate?: (url: string) => void;
}
