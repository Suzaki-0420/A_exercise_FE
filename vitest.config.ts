import path from 'node:path'
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        environment: 'node',
        setupFiles: [
            "./test/setup.ts",
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],

            include: [
                'services/RegisterCategoryService.ts',
                'services/RegisterProductService.ts',
                'services/DeleteProductService.ts',
                'services/SearchProductByCategoryService.ts',
                'services/SearchProductByKeywordService.ts',
                'services/SearchOrdersService.ts',
                'services/UpdateOrderStatusService.ts',
                'services/UpdateProductService.ts',
                'services/RegisterEmployeeAccountService.ts',

                'components/hooks/useRegisterCategory.ts',
                'components/hooks/useSearchOrders.ts',
                'components/hooks/useRegisterEmployeeAccount.ts',
                'components/hooks/useRegisterProduct.ts',
                'components/hooks/useDeleteProduct.ts',
                'components/hooks/useSearchProductByCategory.ts',
                'components/hooks/useSearchProductByKeyword.ts',
                'components/hooks/useAdminLogin.ts',
                'components/hooks/useAdminLogout.ts',
                'components/hooks/useProductCategories.ts',
                'components/hooks/useUpdateOrderStatus.ts',
                'components/hooks/useUpdateProduct.ts',
                'components/hooks/updateProductValidation.ts',
                'components/api/auth/adminSessionStorage.ts',
                'components/api/auth/AdminWelcome.ts',
                'components/common/AdminHeaderNavigation.ts',
                'components/product/edit/productUpdateStorage.ts',

                'infrastructures/AdminAuthRepository.ts',
                'infrastructures/EmployeeAccountRepository.ts',
                'infrastructures/ProductCategoryRepository.ts',
                'infrastructures/OrdersRepository.ts',
                'infrastructures/ProductRepository.ts',

            ],

            exclude: [...configDefaults.exclude, "e2e/**"],

            thresholds: {
                lines: 100,
                branches: 100,
                functions: 100,
                statements: 100,
            },
        },
    },
})