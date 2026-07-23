"use client";

import type { LoggedInAdmin } from "@/models/AdminAuth";

// 画面表示専用。認証可否はHttpOnly CookieとAPIの応答で判定する。
const ADMIN_SESSION_STORAGE_KEY = "fullness:admin-auth:logged-in-admin";
const ADMIN_SESSION_CHANGED_EVENT = "fullness:admin-auth:session-changed";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLoggedInAdmin = (value: unknown): value is LoggedInAdmin =>
  isRecord(value) &&
  typeof value.accountUuid === "string" &&
  typeof value.accountName === "string" &&
  typeof value.employeeName === "string";

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const notifySessionChanged = (): void => {
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
};

/**
 * 保存値から画面表示用の担当者情報を復元する
 */
export const parseLoggedInAdmin = (
  storedValue: string | null,
): LoggedInAdmin | null => {
  if (!storedValue) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(storedValue);
    return isLoggedInAdmin(value) ? value : null;
  } catch {
    return null;
  }
};

/**
 * ログイン成功時の担当者情報を同じタブ内へ一時保存する
 */
export const saveLoggedInAdmin = (loggedInAdmin: LoggedInAdmin): void => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(loggedInAdmin));
    notifySessionChanged();
  } catch {
    // 表示用情報を保存できない場合もログイン処理は継続する。
  }
};

/**
 * 一時保存した担当者情報を取得する
 */
export const loadLoggedInAdmin = (): LoggedInAdmin | null => {
  const storedValue = getLoggedInAdminSnapshot();
  const loggedInAdmin = parseLoggedInAdmin(storedValue);

  if (storedValue && !loggedInAdmin) {
    clearLoggedInAdmin();
  }

  return loggedInAdmin;
};

/**
 * 一時保存した担当者情報を削除する
 */
export const clearLoggedInAdmin = (): void => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    notifySessionChanged();
  } catch {
    // 保存領域を利用できない場合もログアウト処理は継続する。
  }
};

/**
 * Reactから監視するため、保存値を文字列のまま取得する
 */
export const getLoggedInAdminSnapshot = (): string | null => {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * 担当者情報の変更を購読する
 */
export const subscribeLoggedInAdmin = (
  onStoreChange: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_SESSION_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);
  };
};
