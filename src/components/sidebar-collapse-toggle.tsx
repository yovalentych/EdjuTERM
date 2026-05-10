"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const storageKey = "grant-manager-sidebar-collapsed";
const changeEvent = "grant-manager-sidebar-collapsed-change";

function getCollapsedSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey) === "true";
}

function getServerSnapshot() {
  return false;
}

function subscribeToSidebarCollapse(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

export function SidebarCollapseToggle() {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapse,
    getCollapsedSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = String(collapsed);
  }, [collapsed]);

  function toggleSidebar() {
    const nextCollapsed = !collapsed;
    window.localStorage.setItem(storageKey, String(nextCollapsed));
    document.documentElement.dataset.sidebarCollapsed = String(nextCollapsed);
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
      title={collapsed ? "Розгорнути меню" : "Згорнути меню"}
      onClick={toggleSidebar}
      className="sidebar-collapse-toggle hidden h-9 w-9 items-center justify-center border border-slate-200 bg-white text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 lg:inline-flex"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </button>
  );
}
