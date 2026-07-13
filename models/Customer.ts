/**
 * 顧客を表すモデル
 */
export interface Customer {
    /**
     * 顧客識別ID（UUID）
     */
    customerUuid: string;

    /**
     * 顧客名
     */
    name: string;

    /**
     * 顧客名カナ
     */
    kana: string;

    /**
     * 住所1
     */
    address1: string;

    /**
     * 住所2
     */
    address2: string | null;

    /**
     * 電話番号
     */
    phoneNumber: string;

    /**
     * メールアドレス
     */
    mailAddress: string;

    /**
     * アカウント名
     */
    username: string;

    /**
     * パスワード
     */
    password: string;

    /**
     * 登録日時
     */
    createdAt: string;
}