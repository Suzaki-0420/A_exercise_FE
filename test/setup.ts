import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  /*
   * 前のテストファイルで
   * フェイクタイマーが残っていても戻す。
   */
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();

  /*
   * フェイクタイマーが使用されている場合、
   * 登録されたタイマーを削除してから戻す。
   */
  vi.clearAllTimers();
  vi.useRealTimers();

  vi.restoreAllMocks();
});
