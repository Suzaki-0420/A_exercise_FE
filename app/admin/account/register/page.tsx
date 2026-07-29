import { RegisterEmployeeAccount } from "@/components/account/register/RegisterEmployeeAccount";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アカウント登録",
};
/**
 * 担当者アカウント登録ページ
 */
export default function Page() {
  return <RegisterEmployeeAccount />;
}
