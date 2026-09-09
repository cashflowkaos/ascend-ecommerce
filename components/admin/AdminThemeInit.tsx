"use client";

import { useEffect } from "react";

export default function AdminThemeInit() {
  useEffect(() => {
    const shell = document.querySelector(".admin-shell");
    if (!shell) return;

    const saved = localStorage.getItem("ascend-admin-theme") || "light";
    shell.setAttribute("data-admin-theme", saved);
  }, []);

  return null;
}
