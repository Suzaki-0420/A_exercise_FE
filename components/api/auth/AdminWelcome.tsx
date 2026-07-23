"use client";

import {
  getLoggedInAdminSnapshot,
  parseLoggedInAdmin,
  subscribeLoggedInAdmin,
} from "@/components/api/auth/adminSessionStorage";
import { useMemo, useSyncExternalStore } from "react";

const getServerSnapshot = (): null => null;

/**
 * ログインした担当者への案内を表示する
 */
export const AdminWelcome = () => {
  const storedValue = useSyncExternalStore(
    subscribeLoggedInAdmin,
    getLoggedInAdminSnapshot,
    getServerSnapshot,
  );
  const loggedInAdmin = useMemo(
    () => parseLoggedInAdmin(storedValue),
    [storedValue],
  );

  return (
    <p className="mt-2 min-h-5 text-sm text-gray-700">
      {loggedInAdmin && `ようこそ、${loggedInAdmin.employeeName}さん`}
    </p>
  );
};
