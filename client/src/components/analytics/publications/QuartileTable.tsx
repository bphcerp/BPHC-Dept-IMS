import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { analyticsSchemas } from "lib";
export default function QuartileTable({
  qualityIndex,
}: {
  qualityIndex: analyticsSchemas.QualityIndex[];
}) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Journal Quality Index
        </CardTitle>
        <CardDescription>
          Yearly distribution of journal quality and citation metrics
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table className="min-w-full">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="px-4 py-2 text-left">Year</TableHead>
              <TableHead className="px-4 py-2 text-left">
                Avg CiteScore
              </TableHead>
              <TableHead className="px-4 py-2 text-left">
                Avg Impact Factor
              </TableHead>
              <TableHead className="px-4 py-2 text-left">
                Highest CiteScore
              </TableHead>
              <TableHead className="px-4 py-2 text-left">
                Highest Impact Factor
              </TableHead>
              <TableHead className="px-4 py-2 text-left">Q1 %</TableHead>
              <TableHead className="px-4 py-2 text-left">Q2 %</TableHead>
              <TableHead className="px-4 py-2 text-left">Q3 %</TableHead>
              <TableHead className="px-4 py-2 text-left">Q4 %</TableHead>
              <TableHead className="px-4 py-2 text-left">
                No Quartile %
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200">
            {qualityIndex?.length ? (
              qualityIndex.slice(0, 5).map((row) => (
                <TableRow
                  key={row.year}
                  className="odd:bg-white even:bg-gray-50"
                >
                  <TableCell className="px-4 py-2 font-medium">
                    {row.year}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.avgCiteScore?.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.avgImpactFactor?.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.highestCiteScore}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.highestImpactFactor}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.q1Percent?.toFixed(2)}%
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.q2Percent?.toFixed(2)}%
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.q3Percent?.toFixed(2)}%
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.q4Percent?.toFixed(2)}%
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {row.noQuartilePercent?.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No quality index data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
