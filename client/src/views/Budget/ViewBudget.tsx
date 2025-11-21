import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ViewBudget = () => {

  // Mock data based on the schema
  const budgetHeads = [
    { id: '1', name: 'Head A', description: 'Description for Head A', type: 'OPEX' },
    { id: '2', name: 'Head B', description: 'Description for Head B', type: 'COPEX' },
  ];

  const headAllocations: { [key: string]: { budgetCode: number; analysisCode: number; allocationAmount: number; items: { id: string; itemName: string; grantedAmount: number; labId: string; }[] } } = {
    '1': {
      budgetCode: 123,
      analysisCode: 456,
      allocationAmount: 10000,
      items: [
        {
          id: 'i1',
          itemName: 'Item 1',
          grantedAmount: 500,
          labId: 'Lab X',
        },
        {
          id: 'i2',
          itemName: 'Item 2',
          grantedAmount: 700,
          labId: 'Lab Y',
        },
      ],
    },
    '2': {
      budgetCode: 789,
      analysisCode: 987,
      allocationAmount: 20000,
      items: [
        {
          id: 'i3',
          itemName: 'Item 3',
          grantedAmount: 1200,
          labId: 'Lab Z',
        },
      ],
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Budget</h1>

      <h2 className="text-xl font-semibold mb-2">Heads</h2>
      <div className="space-y-4 mb-8">
        {budgetHeads.map((head: { id: string; name: string; description: string; type: string; }) => (
          <div key={head.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Select defaultValue={head.id} disabled={true}>
              <SelectTrigger>
                <SelectValue placeholder="Select a head" />
              </SelectTrigger>
              <SelectContent>
                {budgetHeads.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              id={`budget-code-${head.id}`}
              placeholder="Budget Code"
              value={headAllocations[head.id]?.budgetCode || ''}
              readOnly={true}
            />
            <Input
              id={`analysis-code-${head.id}`}
              placeholder="Analysis Code"
              value={headAllocations[head.id]?.analysisCode || ''}
              readOnly={true}
            />
            <Input
              id={`total-sanctioned-${head.id}`}
              placeholder="Total Sanctioned Amount"
              value={
                headAllocations[head.id]?.allocationAmount || ''
              }
              readOnly={true}
            />
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">Items</h2>
      {budgetHeads.map((head: { id: string; name: string; description: string; type: string; }) => (
        <div key={`items-${head.id}`} className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{head.name}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Sanctioned Amount</TableHead>
                <TableHead>Lab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {headAllocations[head.id]?.items.map((item: { id: string; itemName: string; grantedAmount: number; labId: string; }, index: number) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.grantedAmount}</TableCell>
                  <TableCell>{item.labId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default ViewBudget;
