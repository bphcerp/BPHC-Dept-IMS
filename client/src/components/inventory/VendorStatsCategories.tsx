import { Button } from '../ui/button';
import { DataTable } from './DataTable';

interface VendorStatsCategoriesProps {
    data: any[];
    onVendorClick: (vendor: any) => void;
}

const VendorStatsCategories = ({ data, onVendorClick }: VendorStatsCategoriesProps) => {
    return (
        <DataTable
            columns={[
                {
                    header: 'Vendor Name',
                    accessorKey: 'name',
                    cell: ({ row }: any) => (
                        <Button variant="link" onClick={() => onVendorClick(row.original)}>
                            {row.original.name}
                        </Button>
                    ),
                },
                {
                    header: 'Categories',
                    accessorKey: 'categories',
                    cell: ({ getValue }: any) => getValue()?.map((category: any) => category.name).join(', ') || 'None',
                },
            ]}
            data={data}
        />
    );
};

export default VendorStatsCategories;
