import { useGetAccountProducts } from "../../utils/api/account-product";

type Props = {};

const Product = (props: Props) => {
  const products = useGetAccountProducts();
  console.log(products);
  return <div>Product</div>;
};

export default Product;
