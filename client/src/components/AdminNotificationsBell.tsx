"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string;
  createdAt: string;
  read?: boolean;
}

export function AdminNotificationsBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<AdminNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const token = typeof window !== "undefined" ? localStorage.getItem("uniqart_token") || undefined : undefined;
    const socketUrl = API_BASE || window.location.origin;
    const socket: Socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("socket connected");
      socket.emit("authenticate", { token });
    });

    socket.on("admin_notification", (notif: AdminNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [{ ...notif, read: false }, ...prev];
      });

      setToast(notif);
      setTimeout(() => {
        setToast((curr) => (curr?.id === notif.id ? null : curr));
      }, 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user || user.role !== "admin") return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleNotificationClick(notif: AdminNotification) {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    setIsOpen(false);
    if (toast?.id === notif.id) setToast(null);
    if (notif.url) {
      router.push(notif.url);
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Admin Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {/* Popover Dropdown */}
      {isOpen ? (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`cursor-pointer py-3 transition hover:bg-slate-50 rounded-xl px-2 ${
                    !n.read ? "bg-primary-50/50 font-semibold" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900">{n.title}</div>
                    {!n.read ? <span className="h-2 w-2 rounded-full bg-primary-600 mt-1 flex-shrink-0" /> : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{n.message}</div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Floating Toast */}
      {toast ? (
        <div
          onClick={() => handleNotificationClick(toast)}
          className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 cursor-pointer rounded-2xl border border-primary-200 bg-white p-4 shadow-2xl transition hover:border-primary-400 animate-slide-up"
          role="alert"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary-600 animate-pulse" />
              <div className="text-sm font-extrabold text-slate-900">New approval request received.</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              ✕
            </button>
          </div>
          <div className="mt-1.5 pl-4 text-xs font-semibold text-slate-700">{toast.title}</div>
          <div className="mt-0.5 pl-4 text-xs text-slate-600">{toast.message}</div>
        </div>
      ) : null}
    </div>
  );
}
