import { IProductRepository } from "@/interfaces/IProductRepository";
import { ProductCategoryRepository } from "@/infrastructures/ProductCategoryRepository";
import { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import { ProductRepository } from "@/infrastructures/ProductRepository";
import { IEmployeeAccountRepository } from "@/interfaces/IEmployeeAccountRepository";
import { EmployeeAccountRepository } from "@/infrastructures/EmployeeAccountRepository";
import { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import { RegisterProductService } from "@/services/RegisterProductService";
import { Container } from "inversify";
import { TYPES } from "./types";


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
// サービス(ユースケース)の登録
container.bind<IRegisterProductService>(TYPES.IRegisterProductService).to(RegisterProductService);

export { container };