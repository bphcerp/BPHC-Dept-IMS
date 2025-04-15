import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import hdate from 'human-date'
import LabStatsPerCategory from '@/components/inventory/LabStatsPerCategory';
import LabStatsPerYear from '@/components/inventory/LabStatsPerYear';
import VendorDetailsDialog from '@/components/inventory/VendorDetailsDialog';
import VendorStatsCategories from '@/components/inventory/VendorStatsCategories';
import VendorStatsPerYear from '@/components/inventory/VendorStatsPerYear';
import api from '@/lib/axios-instance';
import { InventoryItem } from 'node_modules/lib/src/types/inventory';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/Auth';
import { permissions } from 'lib';

// Utility function to check if a date is before another date
const isBefore = (date: Date, comparisonDate: Date): boolean => {
    return date.getTime() < comparisonDate.getTime();
};

// Utility function to add days to a date
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};


// Utility function to check if a date is expiring soon or already expired
const checkDateStatus = (date: string | Date | null | undefined, daysThreshold: number) => {
    if (!date) return { isExpiringSoon: false, isExpired: false };
    const targetDate = new Date(date);
    const now = new Date();
    const isExpiringSoon = isBefore(targetDate, addDays(now, daysThreshold)) && targetDate > now;
    const isExpired = isBefore(targetDate, now) || targetDate.toDateString() === now.toDateString();
    return { isExpiringSoon, isExpired };
};

const Stats = () => {
    const [importantDates, setImportantDates] = useState<InventoryItem[]>([]);
    const [selectedStat, setSelectedStat] = useState<string>();
    const [statData, setStatData] = useState<any[]>([]);
    const [vendorDetails, setVendorDetails] = useState(null);
    const [isVendorDialogOpen, setVendorDialogOpen] = useState(false);

    const { checkAccess } = useAuth()

    const handleVendorClick = (vendor: any) => {
        setVendorDetails(vendor);
        setVendorDialogOpen(true);
    };

    useQuery({
        queryKey: ['importantDates'],
        queryFn: async () => {
            try {
                const response = await api('/inventory/stats/important-dates');
                const sortedData = response.data.sort((a: InventoryItem, b: InventoryItem) => {
                    const warrantyA = new Date(a.warrantyTo || 0).getTime();
                    const warrantyB = new Date(b.warrantyTo || 0).getTime();
                    const amcA = new Date(a.amcTo || 0).getTime();
                    const amcB = new Date(b.amcTo || 0).getTime();
                    return Math.max(warrantyB, amcB) - Math.max(warrantyA, amcA);
                });
                setImportantDates(sortedData);
                return 0;
            } catch (error) {
                console.error('Error fetching important dates:', error);
            }
        },
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
    })

    const { isSuccess } = useQuery({
        queryKey: ['stats', selectedStat],
        queryFn: async () => {
            try {
                if (!selectedStat) return 0;
                const response = await api(selectedStat);
                setStatData(response.data);
                return 0;
            } catch (error) {
                console.error(`Error fetching data for ${selectedStat}:`, error);
            }
        },
        refetchOnWindowFocus: false,
        enabled: !!selectedStat,
    })

    return (
        <div className="inventoryStats flex">
            <div className='w-3/4 flex flex-col space-y-4 p-4'>
                <h1 className="text-3xl font-bold text-primary">Stats</h1>
                <div className="mb-4">
                    <Select value={selectedStat} onValueChange={async (value) => {
                        setSelectedStat(value)
                    }}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select a statistic" />
                        </SelectTrigger>
                        <SelectContent>
                            { checkAccess(permissions["/inventory/stats/lab-year"]) && <SelectItem value="inventory/stats/lab-year">Lab Sum Per Year</SelectItem> }
                            { checkAccess(permissions["/inventory/stats/lab-category"]) && <SelectItem value="inventory/stats/lab-category">Lab Sum Per Category</SelectItem> }
                            { checkAccess(permissions["/inventory/stats/vendor-year"]) && <SelectItem value="inventory/stats/vendor-year">Vendor Sum Per Year</SelectItem> }
                            { checkAccess(permissions["/inventory/vendors/get"]) && <SelectItem value="inventory/vendors/get">Vendor Categories</SelectItem> }
                        </SelectContent>
                    </Select>
                </div>
                {selectedStat === "inventory/stats/lab-year" && isSuccess ? <LabStatsPerYear data={statData} /> : <></>}
                {selectedStat === "inventory/stats/lab-category" && isSuccess ? <LabStatsPerCategory data={statData} /> : <></>}
                {selectedStat === "inventory/stats/vendor-year" && isSuccess ? <VendorStatsPerYear data={statData} /> : <></>}
                {selectedStat === "inventory/vendors/get" && isSuccess ? (
                    <VendorStatsCategories data={statData} onVendorClick={handleVendorClick} />
                ) : <></>}
                { !selectedStat && <p className="text-sm text-gray-400">Please select a statistic to view the data</p> }
            </div>
            <div className="w-1/4 h-screen rounded-md overflow-y-auto px-4">
                <h3 className="sticky underline top-0 left-0 p-4 bg-background text-lg text-center font-semibold mb-4">Upcoming Important Dates</h3>
                {importantDates.length > 0 ? (
                    <ul className="space-y-2">
                        {importantDates.map((item) => {
                            const { isExpiringSoon: warrantyExpiring, isExpired: warrantyExpired } = checkDateStatus(item.warrantyTo, 7);
                            const { isExpiringSoon: amcExpiring, isExpired: amcExpired } = checkDateStatus(item.amcTo, 7);

                            return (
                                <li key={item.id}>
                                    <Card className='shadow-sm'>
                                        <CardHeader className="pb-1">
                                            <CardTitle className="text-sm font-medium">{item.itemName}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm text-foreground">
                                            <p className="text-xs text-muted-foreground"><strong>Equipment ID:</strong> {item.equipmentID}</p>
                                            <p className="text-xs text-muted-foreground"><strong>Lab:</strong> {item.lab?.name}</p>
                                            <p className={`${warrantyExpired ? 'text-red-500 line-through' : warrantyExpiring ? 'text-yellow-500 font-semibold' : 'text-xs text-muted-foreground'}`}>
                                                <strong>Warranty To:</strong> {item.warrantyTo ? `${new Date(item.warrantyTo).toLocaleDateString()} (${hdate.relativeTime(new Date(item.warrantyTo))})` : 'N/A'}
                                            </p>
                                            <p className={`${amcExpired ? 'text-red-500 line-through' : amcExpiring ? 'text-yellow-500 font-semibold' : 'text-xs text-muted-foreground'}`}>
                                                <strong>AMC To:</strong> {item.amcTo ? `${new Date(item.amcTo).toLocaleDateString()} (${hdate.relativeTime(new Date(item.amcTo))})` : 'N/A'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No upcoming important dates.</p>
                )}
            </div>
            <VendorDetailsDialog
                open={isVendorDialogOpen}
                onClose={() => setVendorDialogOpen(false)}
                vendorDetails={vendorDetails}
            />
        </div>
    );
};

export default Stats;