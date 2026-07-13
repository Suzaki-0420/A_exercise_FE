/**
 * 部署を表すモデル
 */
export interface Department {
    /**
     * 部署識別ID（UUID）
     */
    departmentUuid: string;

    /**
     * 部署名
     */
    name: string;
}