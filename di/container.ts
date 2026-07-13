import { IProductRepository } from "@/interfaces/IProductRepository";
import { ProductRepository } from "@/infrastructures/ProductRepository";
import { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import { RegisterProductService } from "@/infrastructures/RegisterProductService";
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
// リポジトリの登録(モック版を紐付ける)
container.bind<IProductRepository>(TYPES.IProductRepository).to(ProductRepository);
// サービス(ユースケース)の登録
container.bind<IRegisterProductService>(TYPES.ISearchProductService).to(RegisterProductService);

export { container };