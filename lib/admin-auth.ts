/**
 * 担当者ログイン画面のパス
 */
export const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * セッション切れでログイン画面へ遷移したことを示す理由
 */
export const ADMIN_SESSION_TIMEOUT_REASON = "session-timeout";

/**
 * セッション切れを通知するログイン画面のパス
 */
export const ADMIN_SESSION_TIMEOUT_LOGIN_PATH =
  `${ADMIN_LOGIN_PATH}?reason=${ADMIN_SESSION_TIMEOUT_REASON}`;

/**
 * 仕様書に定められたセッション切れのメッセージ
 */
export const ADMIN_SESSION_TIMEOUT_MESSAGE =
  "セッションが切れました。再度ログインしてください";

/**
 * URLパラメータがセッション切れを示しているか確認する
 */
export const isAdminSessionTimeoutReason = (
  reason: string | string[] | undefined,
): boolean => reason === ADMIN_SESSION_TIMEOUT_REASON;
