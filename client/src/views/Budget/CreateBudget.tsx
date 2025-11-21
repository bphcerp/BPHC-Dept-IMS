import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from "react";

const CreateBudget = () => {
  const [heads, setHeads] = useState([
    { id: '1', name: 'Head A', description: 'Description for Head A', type: 'OPEX' },
    { id: '2', name: 'Head B', description: 'Description for Head B', type: 'COPEX' },
  ]);

  const [allocations, setAllocations] = useState<{ [key: string]: { budgetCode: number; analysisCode: number; allocationAmount: number; items: { id: string; itemName: string; grantedAmount: number; labId: string; }[] } }>({
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
  });

  const addHead = () => {
    const newId = `head-${Date.now()}`;
    setHeads([...heads, { id: newId, name: 'New Head', description: '', type: 'OPEX' }]);
    setAllocations({
      ...allocations,
      [newId]: {
        budgetCode: 0,
        analysisCode: 0,
        allocationAmount: 0,
        items: [],
      },
    });
  };

  const addItem = (headId: string) => {
    const newAllocations = { ...allocations };
    newAllocations[headId].items.push({
      id: `item-${Date.now()}`,
      itemName: 'New Item',
      grantedAmount: 0,
      labId: 'New Lab',
    });
    setAllocations(newAllocations);
  };

  const handleFinish = () => {
    console.log({ heads, allocations });
  };

  const handleAllocationChange = (headId: string, field: string, value: string) => {
    const newAllocations = { ...allocations };
    newAllocations[headId][field] = Number(value);
    setAllocations(newAllocations);
  }

  const handleItemChange = (headId: string, itemIndex: number, field: string, value: string) => {
    const newAllocations = { ...allocations };
    newAllocations[headId].items[itemIndex][field] = value;
    setAllocations(newAllocations);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Budget</h1>

      <h2 className="text-xl font-semibold mb-2">Heads</h2>
      <div className="space-y-4 mb-8">
        {heads.map((head) => (
          <div key={head.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Select defaultValue={head.id}>
              <SelectTrigger>
                <SelectValue placeholder="Select a head" />
              </SelectTrigger>
              <SelectContent>
                {heads.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              id={`budget-code-${head.id}`}
              placeholder="Budget Code"
              value={allocations[head.id]?.budgetCode || ''}
              onChange={(e) => handleAllocationChange(head.id, 'budgetCode', e.target.value)}
            />
            <Input
              id={`analysis-code-${head.id}`}
              placeholder="Analysis Code"
              value={allocations[head.id]?.analysisCode || ''}
              onChange={(e) => handleAllocationChange(head.id, 'analysisCode', e.target.value)}
            />
            <Input
              id={`total-sanctioned-${head.id}`}
              placeholder="Total Sanctioned Amount"
              value={
                allocations[head.id]?.allocationAmount || ''
              }
              onChange={(e) => handleAllocationChange(head.id, 'allocationAmount', e.target.value)}
            />
          </div>
        ))}
      </div>
      <Button className="mb-4" onClick={addHead}>+ Add Head</Button>

      <h2 className="text-xl font-semibold mb-2">Items</h2>
      {heads.map((head) => (
        <div key={`items-${head.id}`} className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{head.name}</h3>
            <Button onClick={() => addItem(head.id)}>+ Add Item</Button>
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
              {allocations[head.id]?.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Input 
                      value={item.itemName} 
                      onChange={(e) => handleItemChange(head.id, index, 'itemName', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.grantedAmount} 
                      type="number"
                      onChange={(e) => handleItemChange(head.id, index, 'grantedAmount', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.labId} 
                      onChange={(e) => handleItemChange(head.id, index, 'labId', e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      <div className="flex justify-end mt-4">
        <Button onClick={handleFinish}>Finish</Button>
      </div>
    </div>
  );
};

export default CreateBudget;
