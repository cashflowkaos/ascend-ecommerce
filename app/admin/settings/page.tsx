"use client";

import { Moon, Settings, Sun } from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [theme, setTheme] = useState("light");

  function changeTheme(value: "light" | "dark") {
    setTheme(value);
    localStorage.setItem("ascend-admin-theme", value);
    document.querySelector(".admin-shell")?.setAttribute("data-admin-theme", value);
  }
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B1841A]">
          Admin
        </span>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your Ascend admin preferences.
        </p>
      </div>

      <section className="admin-panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
          <Settings size={18} className="text-[#B1841A]" />
          <div>
            <h2 className="font-semibold text-neutral-950">
              Appearance
            </h2>
            <p className="text-xs text-neutral-500">
              Choose how the admin portal looks.
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => changeTheme("light")}
            className="flex min-h-20 items-center gap-4 rounded-xl border-2 border-[#D4A11E] bg-[#D4A11E]/5 px-4 text-left"
          >
            <Sun size={22} className="text-[#B1841A]" />
            <div>
              <strong className="block text-sm text-neutral-950">
                Light
              </strong>
              <span className="text-xs text-neutral-500">
                Bright admin interface
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => changeTheme("dark")}
            className="flex min-h-20 items-center gap-4 rounded-xl border border-neutral-200 px-4 text-left transition hover:border-[#D4A11E]/60"
          >
            <Moon size={22} className="text-neutral-600" />
            <div>
              <strong className="block text-sm text-neutral-950">
                Dark
              </strong>
              <span className="text-xs text-neutral-500">
                Dark admin interface
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
