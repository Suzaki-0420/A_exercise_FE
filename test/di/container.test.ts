import { describe, it, expect } from "vitest";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { ProductRepository } from "@/infrastructures/ProductRepository";
import { ProductCategoryRepository } from "@/infrastructures/ProductCategoryRepository";
import { OrdersRepository } from "@/infrastructures/OrdersRepository";
import { EmployeeAccountRepository } from "@/infrastructures/EmployeeAccountRepository";
import { AdminAuthRepository } from "@/infrastructures/AdminAuthRepository";
import { RegisterProductService } from "@/services/RegisterProductService";
import { LoginAdminService } from "@/services/LoginAdminService";
import { LogoutAdminService } from "@/services/LogoutAdminService";
import { SearchProductByKeywordService } from "@/services/SearchProductByKeywordService";
import { RegisterCategoryService } from "@/services/RegisterCategoryService";
import { SearchProductByCategoryService } from "@/services/SearchProductByCategoryService";
import { SearchOrdersService } from "@/services/SearchOrdersService";
import { RegisterEmployeeAccountService } from "@/services/RegisterEmployeeAccountService";
import { DeleteProductService } from "@/services/DeleteProductService";
import { UpdateProductService } from "@/services/UpdateProductService";
import { UpdateOrderStatusService } from "@/services/UpdateOrderStatusService";

describe("DIコンテナの検証", () => {
  it("すべてのリポジトリを取得できる", () => {
    expect(container.get(TYPES.IAdminAuthRepository)).toBeInstanceOf(
      AdminAuthRepository,
    );
    expect(container.get(TYPES.IEmployeeAccountRepository)).toBeInstanceOf(
      EmployeeAccountRepository,
    );
    expect(container.get(TYPES.IOrdersRepository)).toBeInstanceOf(
      OrdersRepository,
    );
    expect(container.get(TYPES.IProductCategoryRepository)).toBeInstanceOf(
      ProductCategoryRepository,
    );
    expect(container.get(TYPES.IProductRepository)).toBeInstanceOf(
      ProductRepository,
    );
  });

  it("すべてのサービスを取得できる", () => {
    expect(container.get(TYPES.IRegisterProductService)).toBeInstanceOf(
      RegisterProductService,
    );
    expect(container.get(TYPES.ILoginAdminService)).toBeInstanceOf(
      LoginAdminService,
    );
    expect(container.get(TYPES.ILogoutAdminService)).toBeInstanceOf(
      LogoutAdminService,
    );
    expect(container.get(TYPES.ISearchProductByKeywordService)).toBeInstanceOf(
      SearchProductByKeywordService,
    );
    expect(container.get(TYPES.IRegisterCategoryService)).toBeInstanceOf(
      RegisterCategoryService,
    );
    expect(container.get(TYPES.ISearchProductByCategoryService)).toBeInstanceOf(
      SearchProductByCategoryService,
    );
    expect(container.get(TYPES.ISearchOrdersService)).toBeInstanceOf(
      SearchOrdersService,
    );
    expect(container.get(TYPES.IRegisterEmployeeAccountService)).toBeInstanceOf(
      RegisterEmployeeAccountService,
    );
    expect(container.get(TYPES.IDeleteProductService)).toBeInstanceOf(
      DeleteProductService,
    );
    expect(container.get(TYPES.IUpdateProductService)).toBeInstanceOf(
      UpdateProductService,
    );
    expect(container.get(TYPES.IUpdateOrderStatusService)).toBeInstanceOf(
      UpdateOrderStatusService,
    );
  });
});
