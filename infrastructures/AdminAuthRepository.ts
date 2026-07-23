import type { IAdminAuthRepository } from "@/interfaces/IAdminAuthRepository";
import {
  AdminLoginError,
  AdminLogoutError,
  type AdminLoginCredentials,
  type AdminLoginFieldErrors,
  type AdminLogoutResult,
  type LoggedInAdmin,
} from "@/models/AdminAuth";
import { injectable } from "inversify";

type ApiError = {
  code?: string;
  message?: string;
  field?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T | null;
  errors?: ApiError[] | Record<string, string[]>;
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseResponseBody = async <T>(
  response: Response,
): Promise<ApiResponse<T>> => {
  const body: unknown = await response.json().catch(() => null);

  return isRecord(body) ? (body as ApiResponse<T>) : {};
};

const normalizeFieldName = (
  fieldName: string,
): keyof AdminLoginCredentials | null => {
  const normalized = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);

  if (normalized === "accountName" || normalized === "password") {
    return normalized;
  }

  return null;
};

const getFieldErrors = (
  errors: ApiResponse<unknown>["errors"],
): AdminLoginFieldErrors => {
  if (!errors || Array.isArray(errors)) {
    return {};
  }

  return Object.entries(errors).reduce<AdminLoginFieldErrors>(
    (result, [fieldName, messages]) => {
      const normalizedField = normalizeFieldName(fieldName);

      if (normalizedField && Array.isArray(messages) && messages.length > 0) {
        result[normalizedField] = String(messages[0]);
      }

      return result;
    },
    {},
  );
};

const getErrorMessage = (
  response: Response,
  body: ApiResponse<unknown>,
): string => {
  if (Array.isArray(body.errors)) {
    const apiMessage = body.errors.find((error) => error.message)?.message;

    if (apiMessage) {
      return apiMessage;
    }
  }

  if (body.message) {
    return body.message;
  }

  switch (response.status) {
    case 400:
      return "入力内容を確認してください。";
    case 401:
      return "アカウント名またはパスワードが正しくありません。";
    case 403:
      return "アカウントがロックされています。しばらく経ってから再度お試しください。";
    default:
      return "システムエラーが発生しました。管理者に連絡してください。";
  }
};

const getLogoutErrorMessage = (
  response: Response,
  body: ApiResponse<unknown>,
): string => {
  if (Array.isArray(body.errors)) {
    const apiMessage = body.errors.find((error) => error.message)?.message;

    if (apiMessage) {
      return apiMessage;
    }
  }

  if (body.message) {
    return body.message;
  }

  if (response.status === 401) {
    return "ログインの有効期限が切れています。再度ログインしてください。";
  }

  return "ログアウトできませんでした。しばらく経ってから再度お試しください。";
};

/**
 * 担当者認証Repository
 */
@injectable()
export class AdminAuthRepository implements IAdminAuthRepository {
  /**
   * 担当者としてログインする
   */
  public async login(
    credentials: AdminLoginCredentials,
  ): Promise<LoggedInAdmin> {
    let response: Response;

    try {
      response = await fetch("/proxy-api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      throw new AdminLoginError(
        "サーバーに接続できませんでした。しばらく経ってから再度お試しください。",
      );
    }

    const body = await parseResponseBody<LoggedInAdmin>(response);

    if (!response.ok) {
      throw new AdminLoginError(
        getErrorMessage(response, body),
        getFieldErrors(body.errors),
      );
    }

    if (
      body.success !== true ||
      !body.data ||
      typeof body.data.accountUuid !== "string" ||
      typeof body.data.accountName !== "string" ||
      typeof body.data.employeeName !== "string"
    ) {
      throw new AdminLoginError(
        "ログイン結果を確認できませんでした。管理者に連絡してください。",
      );
    }

    return body.data;
  }

  /**
   * 担当者をログアウトする
   */
  public async logout(): Promise<void> {
    let response: Response;

    try {
      response = await fetch("/proxy-api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      throw new AdminLogoutError(
        "サーバーに接続できませんでした。しばらく経ってから再度お試しください。",
      );
    }

    const body = await parseResponseBody<AdminLogoutResult>(response);

    if (!response.ok) {
      throw new AdminLogoutError(
        getLogoutErrorMessage(response, body),
        response.status,
      );
    }

    if (body.success !== true || body.data?.loggedOut !== true) {
      throw new AdminLogoutError(
        "ログアウト結果を確認できませんでした。管理者に連絡してください。",
      );
    }
  }
}
