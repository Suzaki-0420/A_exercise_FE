import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        environment: 'node',

        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],

            include: [
                'services/RegisterCategoryService.ts',
                'components/hooks/useRegisterCategory.ts',
                'infrastructures/AdminAuthRepository.ts',
                'infrastructures/EmployeeAccountRepository.ts',
                'infrastructures/ProductCategoryRepository.ts',
                'infrastructures/OrdersRepository.ts',
                'infrastructures/ProductRepository.ts',

            ],

            thresholds: {
                lines: 100,
                branches: 100,
                functions: 100,
                statements: 100,
            },
        },
    },
})