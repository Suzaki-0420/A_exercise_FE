// @vitest-environment jsdom

import { AdminWelcome } from "@/components/api/auth/AdminWelcome";
import { saveLoggedInAdmin } from "@/components/api/auth/adminSessionStorage";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("AdminWelcome", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("ログインした担当者名を表示する", () => {
    saveLoggedInAdmin({
      accountUuid: "10000000-0000-0000-0000-000000000001",
      accountName: "yamada01",
      employeeName: "山田太郎",
    });

    render(<AdminWelcome />);

    expect(screen.getByText("ようこそ、山田太郎さん")).toBeTruthy();
  });

  it("担当者情報がない場合は名前を表示しない", () => {
    render(<AdminWelcome />);

    expect(screen.queryByText(/ようこそ/)).toBeNull();
  });

  it("サーバーレンダリング時はブラウザの保存情報を参照しない", () => {
    saveLoggedInAdmin({
      accountUuid: "10000000-0000-0000-0000-000000000001",
      accountName: "yamada01",
      employeeName: "山田太郎",
    });

    expect(renderToString(<AdminWelcome />)).not.toContain("山田太郎");
  });
});
