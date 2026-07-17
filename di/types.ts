/**
 * DIコンテナ用の識別子(Symbol)定義
 */
export const TYPES = {
    // インフラストラクチャ層
    IProductRepository: Symbol.for("IProductRepository"),
    IProductCategoryRepository: Symbol.for("IProductCategoryRepository"),
    IEmployeeAccountRepository: Symbol.for("IEmployeeAccountRepository"),
    IOrdersRepository: Symbol.for("IOrdersRepository"),
    IAdminAuthRepository: Symbol.for("IAdminAuthRepository"),
    // サービス(ユースケース)層
    IRegisterProductService: Symbol.for("IRegisterProductService"),
    ILoginAdminService: Symbol.for("ILoginAdminService"),
    ILogoutAdminService: Symbol.for("ILogoutAdminService"),
    ISearchProductByKeywordService: Symbol.for("ISearchProductByKeywordService"),
    IRegisterCategoryService: Symbol.for("IRegisterCategoryService"),
    ISearchProductByCategoryService: Symbol.for("ISearchProductByCategoryService"),
    ISearchOrdersService: Symbol.for("ISearchOrdersService"),
    IRegisterEmployeeAccountService: Symbol.for("IRegisterEmployeeAccountService"),
    IDeleteProductService: Symbol.for("IDeleteProductService"),
    IUpdateProductService: Symbol.for("IUpdateProductService"),
};
