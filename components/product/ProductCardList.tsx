import { Product } from "@/models/Product";
import { ProductCard } from "./ProductCard";

type ProductCardListProps = {
    products: Product[];
    onUpdate: (
        product: Product
    ) => void;
    onDelete: (
        product: Product
    ) => void;
};

export const ProductCardList = ({
    products,
    onUpdate,
    onDelete,
}: ProductCardListProps) => {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <ProductCard
                    key={product.productUuid}
                    product={product}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
};