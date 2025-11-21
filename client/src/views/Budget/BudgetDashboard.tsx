import { Button } from "@/components/ui/button";
import { masterbudgetSchema } from "../../../../lib/src/schemas/Budget.ts"
import { z } from "zod"
import { DataTable } from "@/components/shared/datatable/DataTable.tsx"
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query"
//import api from "@/lib/axios-instance.ts"
import { Link } from "react-router-dom"

//TODO: Use types from ../../../../lib/src/types as and when avaiable

type Budget = z.infer<typeof masterbudgetSchema>;

const columns: ColumnDef<Budget>[] = [
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "totalAllocated",
    header: "Total Allocated",
  },
  {
    accessorKey: "initiatedByEmail",
    header: "Initiated By",
  },
  {
    id: "Actions",
    accessorFn: () => [],
    cell: ({ row }) => {
      const budget = row.original
      return (
        <Link to={`/budget/${budget.id}`}> <Button> View Budget </Button></Link>
      )
    }
  }
]

const BudgetDashboard = () => {
  const { data, isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      //TODO: integrate api soon!

      return [
        {
          id: "test_id_1",
          year: 2024,
          totalAllocated: 1000000,
          initiatedByEmail: "test1@gmail.com",
          convenerEmail: "convener@gmail.com",
        },
        {
          id: "test_id_2",
          year: 2025,
          totalAllocated: 122100,
          initiatedByEmail: "test2@gmail.com",
          convenerEmail: "convener@gmail.com",
        }
      ]
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold"> Budget </h1>
        <Link to="/budget/create">
          <Button> Create Budget </Button>
        </Link>
      </div>
      {isLoading ? (<p> Loading...</p>) : (<DataTable columns={columns} data={data ?? []} />)}
    </div>
  )
}

export default BudgetDashboard
