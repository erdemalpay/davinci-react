import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";
import { AccountProduct, MenuCategory, UpperCategory } from "../../../types";

type Props = {
  chartConfig: any;
  selectedProduct?: AccountProduct;
  selectedCategory?: MenuCategory;
  selectedUpperCategory?: UpperCategory;
};

const PriceChart = ({
  chartConfig,
  selectedProduct,
  selectedCategory,
  selectedUpperCategory,
}: Props) => {
  return (
    <Card className="shadow-none">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="flex flex-row gap-4 rounded-none  items-center"
      >
        <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
          <Square3Stack3DIcon className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="h6" color="blue-gray">
            {selectedProduct && selectedProduct?.name}
            {selectedCategory && selectedCategory?.name}
            {selectedUpperCategory && selectedUpperCategory?.name}
          </Typography>
        </div>
      </CardHeader>
      <CardBody className="px-2 pb-0">
        <Chart {...(chartConfig as any)} />
      </CardBody>
    </Card>
  );
};

export default PriceChart;
