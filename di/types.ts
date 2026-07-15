/**
 * DIコンテナ用の識別子(Symbol)定義
 */
export const TYPES = {
    // インフラストラクチャ層
    IProductRepository: Symbol.for("IProductRepository"),
    IProductCategoryRepository: Symbol.for("IProductCategoryRepository"),
    IEmployeeAccountRepository: Symbol.for("IEmployeeAccountRepository"),
    IAdminAuthRepository: Symbol.for("IAdminAuthRepository"),
    // サービス(ユースケース)層
    IRegisterProductService: Symbol.for("IRegisterProductService"),
    ILoginAdminService: Symbol.for("ILoginAdminService"),
};
