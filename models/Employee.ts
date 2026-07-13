import { Department } from "./Department";

/**
 * 社員を表すモデル
 */
export interface Employee {
    /**
     * 社員識別ID（UUID）
     */
    employeeUuid: string;

    /**
     * 社員名
     */
    name: string;

    /**
     * 社員カナ
     */
    kana: string;

    /**
     * 所属部署
     */
    department: Department | null;
}