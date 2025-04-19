import { FunctionComponent, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import api from "@/lib/axios-instance";
import { Laboratory } from "node_modules/lib/src/types/inventory";
import { DataTable } from "./DataTable";
import { useQuery } from "@tanstack/react-query";

export interface StatData {
  totalQuantity: number;
  totalPrice: number;
}

interface LabStatsPerYear {
  lab: Laboratory;
  [year: number]: StatData | undefined; // Year as a key with structured data
}

interface LabStatsPerYearProps {
  data: Array<{
    labId: string;
    year: number;
    totalQuantity: number;
    totalPrice: number;
  }>;
}

const LabStatsPerYear: FunctionComponent<LabStatsPerYearProps> = ({ data }) => {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2008 + 1 },
    (_, i) => currentYear - i
  );
  const [tableData, setTableData] = useState<LabStatsPerYear[]>([]);

  useQuery({
    queryKey: ["labStatsPerYear", data],
    queryFn: async () => {
      try {
        const response = await api("/inventory/labs/get");
        setLabs(response.data);

        // Transform data: Group by `labId`
        const labMap: { [key: string]: LabStatsPerYear } = {};

        response.data.forEach((lab: Laboratory) => (labMap[lab.id] = { lab }));

        data.forEach(({ labId, year, totalQuantity, totalPrice }) => {
          console.log(labMap, labId, year, data);
          labMap[labId][year] = {
            totalQuantity: Number(totalQuantity),
            totalPrice: Number(totalPrice),
          };
        });
        setTableData(Object.values(labMap));
        return 0;
      } catch (error) {
        console.error("Error fetching labs:", error);
        console.log(data);
        return 0;
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!data,
  });

  const columns: ColumnDef<LabStatsPerYear>[] = [
    {
      accessorKey: "lab.name",
      header: "Lab Name",
      meta: { tailwindWidthString: "min-w-32" },
    },
    ...(years.map((year) => ({
      accessorKey: year.toString(),
      header: year.toString(),
      cell: ({ row }) => {
        const yearData = row.original[year];
        if (yearData) {
          return `${yearData.totalQuantity} (${yearData.totalPrice.toLocaleString(
            "en-IN",
            {
              style: "currency",
              currency: "INR",
            }
          )})`;
        }
        return "-";
      },
      meta: {
        calculateSum: (rows: LabStatsPerYear[]) => {
          const totalQuantitySum = rows.reduce(
            (sum, row) => sum + (row[year]?.totalQuantity || 0),
            0
          );
          const totalPriceSum = rows.reduce(
            (sum, row) => sum + (row[year]?.totalPrice || 0),
            0
          );
          return `${totalQuantitySum} (${totalPriceSum.toLocaleString("en-IN", { style: "currency", currency: "INR" })})`;
        },
      },
    })) as ColumnDef<LabStatsPerYear>[]),
  ];

  return labs.length ? (
    <DataTable
      data={tableData}
      columns={columns}
      mainSearchColumn={"lab_name" as keyof LabStatsPerYear}
    />
  ) : null;
};

export default LabStatsPerYear;
