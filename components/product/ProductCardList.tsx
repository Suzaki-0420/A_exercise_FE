import { Product } from "@/models/Product";
import { ProductCard } from "./ProductCard";

type ProductCardListProps = {
    products: Product[];
};

export const ProductCardList = ({
    products,
}: ProductCardListProps) => {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <ProductCard
                    key={product.productUuid}
                    product={product}
                />
            ))}
        </div>
    );
};