import { IProductRepository } from "@/interfaces/IProductRepository";
import { ProductCategoryRepository } from "@/infrastructures/ProductCategoryRepository";
import { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import { ProductRepository } from "@/infrastructures/ProductRepository";
import { IEmployeeAccountRepository } from "@/interfaces/IEmployeeAccountRepository";
import { EmployeeAccountRepository } from "@/infrastructures/EmployeeAccountRepository";
import { IOrdersRepository } from "@/interfaces/IOrdersRepository";
import { OrdersRepository } from "@/infrastructures/OrdersRepository";
import { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import { RegisterProductService } from "@/services/RegisterProductService";
import { AdminAuthRepository } from "@/infrastructures/AdminAuthRepository";
import { LoginAdminService } from "@/services/LoginAdminService";
import type { IAdminAuthRepository } from "@/interfaces/IAdminAuthRepository";
import type { ILoginAdminService } from "@/interfaces/ILoginAdminService";
import type { ILogoutAdminService } from "@/interfaces/ILogoutAdminService";
import { LogoutAdminService } from "@/services/LogoutAdminService";
import type { IUpdateProductService } from "@/interfaces/IUpdateProductService";
import { UpdateProductService } from "@/services/UpdateProductService";
import { Container } from "inversify";
import { TYPES } from "./types";
import { SearchProductByKeywordService } from "@/services/SearchProductByKeywordService";
import { ISearchProductByKeywordService } from "@/interfaces/ISearchProductByKeywordService";
import { IRegisterCategoryService } from "@/interfaces/IRegisterCategoryService";
import { RegisterCategoryService } from "@/services/RegisterCategoryService";
import { SearchProductByCategoryService } from "@/services/SearchProductByCategoryService";
import { ISearchProductByCategoryService } from "@/interfaces/ISearchProductByCategoryService";
import { ISearchOrdersService } from "@/interfaces/ISearchOrdersService";
import { SearchOrdersService } from "@/services/SearchOrdersService";
import { IRegisterEmployeeAccountService } from "@/interfaces/IRegisterEmployeeAccountService";
import { RegisterEmployeeAccountService } from "@/services/RegisterEmployeeAccountService";
import { IDeleteProductService } from "@/interfaces/IDeleteProductService";
import { DeleteProductService } from "@/services/DeleteProductService";



/**
 * 演習 6-2 データアクセスとサービスを実装する
 * DIコンテナの初期化と依存関係の登録
 */
const container = new Container();
// ---------------------------------------------------------
// バインディング（登録）設定
// ---------------------------------------------------------
// リポジトリの登録
container.bind<IProductRepository>(TYPES.IProductRepository).to(ProductRepository);
container.bind<IProductCategoryRepository>(TYPES.IProductCategoryRepository).to(ProductCategoryRepository);
container.bind<IEmployeeAccountRepository>(TYPES.IEmployeeAccountRepository).to(EmployeeAccountRepository);
container.bind<IAdminAuthRepository>(TYPES.IAdminAuthRepository).to(AdminAuthRepository);
container.bind<IOrdersRepository>(TYPES.IOrdersRepository).to(OrdersRepository);
// サービス(ユースケース)の登録
container.bind<IRegisterProductService>(TYPES.IRegisterProductService).to(RegisterProductService);
container.bind<ILoginAdminService>(TYPES.ILoginAdminService).to(LoginAdminService);
container.bind<ILogoutAdminService>(TYPES.ILogoutAdminService).to(LogoutAdminService);
container.bind<ISearchProductByKeywordService>(TYPES.ISearchProductByKeywordService).to(SearchProductByKeywordService);
container.bind<IRegisterCategoryService>(TYPES.IRegisterCategoryService).to(RegisterCategoryService);
container.bind<ISearchProductByCategoryService>(TYPES.ISearchProductByCategoryService).to(SearchProductByCategoryService);
container.bind<ISearchOrdersService>(TYPES.ISearchOrdersService).to(SearchOrdersService);
container.bind<IRegisterEmployeeAccountService>(TYPES.IRegisterEmployeeAccountService).to(RegisterEmployeeAccountService);
container.bind<IDeleteProductService>(TYPES.IDeleteProductService).to(DeleteProductService);
container.bind<IUpdateProductService>(TYPES.IUpdateProductService).to(UpdateProductService);

export { container };
