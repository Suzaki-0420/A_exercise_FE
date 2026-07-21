/**
 * 商品削除Service
 */
export interface IDeleteProductService {
    /**
     * 商品を削除する
     *
     * @param productUuid 商品UUID
     */
    execute(
        productUuid: string
    ): Promise<boolean>;
}