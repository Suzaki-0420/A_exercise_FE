/**
 * DIコンテナ用の識別子(Symbol)定義
 */
export const TYPES = {
    // インフラストラクチャ層
    IProductRepository: Symbol.for("IProductRepository"),
    IProductCategoryRepository: Symbol.for("IProductCategoryRepository"),
    IEmployeeAccountRepository: Symbol.for("IEmployeeAccountRepository"),
    // サービス(ユースケース)層
    IRegisterProductService: Symbol.for("IRegisterProductService"),
};