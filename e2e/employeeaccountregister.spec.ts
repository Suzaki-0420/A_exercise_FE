import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * playwright.config.tsのproject側でstorageStateを設定済みなら、
 * このtest.useは削除しても構いません。
 */
test.use({
  storageState: "e2e/.auth/admin.json",
});

/**
 * 担当者アカウント登録画面を開く
 */
const openAccountRegisterPage = async (page: Page): Promise<void> => {
  await page.goto("/admin/account/register");

  await expect(
    page.getByRole("heading", {
      name: "担当者アカウント登録",
      exact: true,
    }),
  ).toBeVisible();

  /*
   * 社員情報の読み込みが終了し、
   * フォームが描画されるまで待つ
   */
  await expect(
    page.getByText("社員情報を読み込んでいます。", {
      exact: true,
    }),
  ).toHaveCount(0, {
    timeout: 15_000,
  });

  await expect(
    page.getByLabel("社員名", {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15_000,
  });
};

/**
 * 担当者アカウント登録画面の要素
 */
type AccountRegisterFormElements = {
  employeeSelect: Locator;
  accountNameInput: Locator;
  passwordInput: Locator;
  confirmButton: Locator;
  cancelButton: Locator;
};

/**
 * 入力フォームの要素を取得する
 */
const getFormElements = (page: Page): AccountRegisterFormElements => {
  return {
    employeeSelect: page.getByLabel("社員名"),

    accountNameInput: page.getByLabel("アカウント名"),

    passwordInput: page.getByLabel("パスワード"),

    confirmButton: page.getByRole("button", {
      name: "確認",
      exact: true,
    }),

    cancelButton: page.getByRole("button", {
      name: "キャンセル",
      exact: true,
    }),
  };
};

/**
 * 入力欄へ値を入力し、blurバリデーションを実行する
 */
const fillAndBlur = async (input: Locator, value: string): Promise<void> => {
  await input.fill(value);
  await input.blur();
};

/**
 * テキスト入力欄を一度操作して空にし、
 * 必須入力のblurバリデーションを実行する
 */
const clearAndBlur = async (input: Locator): Promise<void> => {
  await input.fill("仮入力");
  await input.clear();
  await input.blur();
};

test.describe("担当者アカウント登録画面", () => {
  test.beforeEach(async ({ page }) => {
    await openAccountRegisterPage(page);
  });

  test("画面の初期表示が正しい", async ({ page }) => {
    const {
      employeeSelect,
      accountNameInput,
      passwordInput,
      confirmButton,
      cancelButton,
    } = getFormElements(page);

    await expect(employeeSelect).toBeVisible();

    await expect(accountNameInput).toBeVisible();

    await expect(passwordInput).toBeVisible();

    await expect(confirmButton).toBeVisible();

    await expect(cancelButton).toBeVisible();

    await expect(employeeSelect).toHaveValue("");

    await expect(accountNameInput).toHaveValue("");

    await expect(passwordInput).toHaveValue("");

    await expect(passwordInput).toHaveAttribute("type", "password");

    /*
     * 初期状態でも確認ボタンは有効なため、
     * disabledの確認は行わない。
     */
    await expect(confirmButton).toBeEnabled();
  });

  test("未登録社員が一覧に表示される", async ({ page }) => {
    const { employeeSelect } = getFormElements(page);

    await expect(employeeSelect).toBeVisible();

    /*
     * 全社員を確認する必要はなく、
     * 代表となる未登録社員1件を確認する。
     *
     * DBに必ず存在する社員名へ
     * 必要に応じて変更してください。
     */
    await expect(
      employeeSelect.getByRole("option", {
        name: "佐藤 花子",
        exact: true,
      }),
    ).toBeAttached();
  });

  test("社員名を選択せずフォーカスを外すと必須エラーが表示される", async ({
    page,
  }) => {
    const { employeeSelect } = getFormElements(page);

    await employeeSelect.focus();
    await employeeSelect.blur();

    await expect(
      page.getByText("社員名を選択してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("アカウント名を空にしてフォーカスを外すと必須エラーが表示される", async ({
    page,
  }) => {
    const { accountNameInput } = getFormElements(page);

    await clearAndBlur(accountNameInput);

    await expect(
      page.getByText("アカウント名を入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("パスワードを空にしてフォーカスを外すと必須エラーが表示される", async ({
    page,
  }) => {
    const { passwordInput } = getFormElements(page);

    await clearAndBlur(passwordInput);

    await expect(
      page.getByText("パスワードを入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("アカウント名が5文字未満の場合は文字数エラーが表示される", async ({
    page,
  }) => {
    const { accountNameInput } = getFormElements(page);

    await fillAndBlur(accountNameInput, "abc1");

    await expect(
      page.getByText("アカウント名は5文字以上20文字以内で入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("アカウント名は20文字を超えて入力できない", async ({ page }) => {
    const { accountNameInput } = getFormElements(page);

    /*
     * 22文字入力する
     */
    await accountNameInput.fill("abcdefghijklmnopqrstuv");

    /*
     * maxLength=20 のため、
     * 20文字までしか入力されないことを確認する
     */
    await expect(accountNameInput).toHaveValue("abcdefghijklmnopqrst");

    /*
     * 入力欄の最大文字数設定も確認する
     */
    await expect(accountNameInput).toHaveAttribute("maxlength", "20");
  });

  test("アカウント名に半角英数字以外を入力すると文字種エラーが表示される", async ({
    page,
  }) => {
    const { accountNameInput } = getFormElements(page);

    await fillAndBlur(accountNameInput, "山田太郎01");

    await expect(
      page.getByText("アカウント名は半角英数字で入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("アカウント名に同じ文字だけを入力すると連続文字エラーが表示される", async ({
    page,
  }) => {
    const { accountNameInput } = getFormElements(page);

    /*
     * 画面の例と同じく、
     * 同一文字だけを5文字入力する
     */
    await fillAndBlur(accountNameInput, "aaaaa");

    await expect(
      page.getByText("アカウント名に同じ文字のみを使用することはできません。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("パスワードが5文字未満の場合は文字数エラーが表示される", async ({
    page,
  }) => {
    const { passwordInput } = getFormElements(page);

    await fillAndBlur(passwordInput, "abc1");

    await expect(
      page.getByText("パスワードは5文字以上20文字以内で入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("パスワードは20文字を超えて入力できない", async ({ page }) => {
    const { passwordInput } = getFormElements(page);

    /*
     * 22文字入力する
     */
    await passwordInput.fill("abcdefghijklmnopqrstuv");

    /*
     * maxLength=20 のため、
     * 20文字までしか入力されないことを確認する
     */
    await expect(passwordInput).toHaveValue("abcdefghijklmnopqrst");

    /*
     * 入力欄の最大文字数設定も確認する
     */
    await expect(passwordInput).toHaveAttribute("maxlength", "20");
  });

  test("パスワードに半角英数字以外を入力すると文字種エラーが表示される", async ({
    page,
  }) => {
    const { passwordInput } = getFormElements(page);

    await fillAndBlur(passwordInput, "パスワード123");

    await expect(
      page.getByText("パスワードは半角英数字で入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("パスワードに同じ文字だけを入力すると連続文字エラーが表示される", async ({
    page,
  }) => {
    const { passwordInput } = getFormElements(page);

    await fillAndBlur(passwordInput, "11111");

    await expect(
      page.getByText("パスワードに同じ文字のみを使用することはできません。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("入力エラーがある場合は確認モーダルが表示されない", async ({ page }) => {
    const { accountNameInput, confirmButton } = getFormElements(page);

    await accountNameInput.fill("aaaaa");

    await accountNameInput.blur();

    await expect(
      page.getByText("アカウント名に同じ文字のみを使用することはできません。", {
        exact: true,
      }),
    ).toBeVisible();

    await confirmButton.click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("正常な値を入力すると確認ボタンが有効になる", async ({ page }) => {
    const { employeeSelect, accountNameInput, passwordInput, confirmButton } =
      getFormElements(page);

    /*
     * 先頭が「選択してください」、
     * 2番目以降が実際の社員である想定
     */
    await employeeSelect.selectOption({
      index: 1,
    });

    await fillAndBlur(accountNameInput, "Suzuki01");

    await fillAndBlur(passwordInput, "passSuzuki01");

    await expect(confirmButton).toBeEnabled();
  });

  test("正常な値を入力して確認すると確認モーダルが表示される", async ({
    page,
  }) => {
    const { employeeSelect, accountNameInput, passwordInput, confirmButton } =
      getFormElements(page);

    /*
     * 社員一覧の非同期取得が終わり、
     * 2番目のoptionが描画されるまで待つ。
     *
     * 先頭は「選択してください」、
     * 2番目以降が実際の社員という想定。
     */
    const firstEmployeeOption = employeeSelect.locator("option").nth(1);

    await expect(firstEmployeeOption).toBeAttached();

    const employeeName = (await firstEmployeeOption.textContent())?.trim();

    const employeeUuid = await firstEmployeeOption.getAttribute("value");

    if (!employeeName || !employeeUuid) {
      throw new Error("選択可能な社員情報を取得できませんでした。");
    }

    /*
     * indexではなくvalueで選択する
     */
    await employeeSelect.selectOption(employeeUuid);

    await accountNameInput.fill("Suzuki01");
    await accountNameInput.blur();

    await passwordInput.fill("passSuzuki01");
    await passwordInput.blur();

    await confirmButton.click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText(employeeName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText("Suzuki01", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("キャンセルを押すと入力内容が初期化される", async ({ page }) => {
    const { employeeSelect, accountNameInput, passwordInput, cancelButton } =
      getFormElements(page);

    /*
     * キャンセル前のURLを保持する
     */
    const currentUrl = page.url();

    /*
     * 一度フォームへ値を入力する
     */
    await employeeSelect.selectOption({
      index: 1,
    });

    await accountNameInput.fill("Suzuki01");

    await passwordInput.fill("passSuzuki01");

    /*
     * 入力されたことを事前確認する
     */
    await expect(employeeSelect).not.toHaveValue("");

    await expect(accountNameInput).toHaveValue("Suzuki01");

    await expect(passwordInput).toHaveValue("passSuzuki01");

    /*
     * キャンセルを押す
     */
    await cancelButton.click();

    /*
     * ページ遷移していないことを確認する
     */
    await expect(page).toHaveURL(currentUrl);

    /*
     * 各入力値が初期状態へ戻ることを確認する
     */
    await expect(employeeSelect).toHaveValue("");

    await expect(accountNameInput).toHaveValue("");

    await expect(passwordInput).toHaveValue("");

    /*
     * 確認モーダルが表示されていないことを確認する
     */
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("確認モーダルで戻るを押すと入力値を保持したまま入力画面へ戻る", async ({
    page,
  }) => {
    const { employeeSelect, accountNameInput, passwordInput, confirmButton } =
      getFormElements(page);

    /*
     * 正常な値を入力する
     */
    await employeeSelect.selectOption({
      index: 1,
    });

    await accountNameInput.fill("Suzuki01");
    await accountNameInput.blur();

    await passwordInput.fill("passSuzuki01");
    await passwordInput.blur();

    /*
     * 確認モーダルを開く
     */
    await confirmButton.click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    /*
     * 「戻る」を押す
     */
    await dialog
      .getByRole("button", {
        name: "戻る",
        exact: true,
      })
      .click();

    /*
     * 確認モーダルが閉じる
     */
    await expect(page.getByRole("dialog")).toHaveCount(0);

    /*
     * 入力値が保持されている
     */
    await expect(employeeSelect).not.toHaveValue("");

    await expect(accountNameInput).toHaveValue("Suzuki01");

    await expect(passwordInput).toHaveValue("passSuzuki01");
  });

  test("既に使用されているアカウント名を入力すると重複エラーが表示される", async ({
    page,
  }) => {
    const { accountNameInput } = getFormElements(page);

    /*
     * 既に登録済みのアカウント名を入力する
     */
    await accountNameInput.fill("Yamada");

    /*
     * blurで重複チェックを実行
     */
    await accountNameInput.blur();

    /*
     * 重複エラーが表示される
     */
    await expect(
      page.getByText("このアカウント名は既に使用されています。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * 確認モーダルは表示されない
     */
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
