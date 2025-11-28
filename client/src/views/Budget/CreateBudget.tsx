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
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios-instance";
import { Laboratory } from "../../../../lib/src/types/inventory";

type Allocation = {
  budgetCode: number;
  analysisCode: number;
  allocationAmount: number;
  items: {
    id: string;
    itemName: string;
    grantedAmount: number;
    labId: string;
    [key: string]: any;
  }[];
  [key: string]: any;
};

const CreateBudget = () => {
  const [heads, setHeads] = useState([
    { id: '1', name: 'Head A', description: 'Description for Head A', type: 'OPEX' },
    { id: '2', name: 'Head B', description: 'Description for Head B', type: 'COPEX' },
  ]);

  const [allocations, setAllocations] = useState<{ [key: string]: Allocation }>({
    '1': {
      budgetCode: 0,
      analysisCode: 0,
      allocationAmount: 0,
      items: [],
    },
    '2': {
      budgetCode: 0,
      analysisCode: 0,
      allocationAmount: 0,
      items: [],
    },
  });

  const [labs, setLabs] = useState<Laboratory[]>([]);

  useEffect(() => {
    const fetchLabs = async () => {
      const response = await api.get('/inventory/labs/get');
      setLabs(response.data);
    };
    fetchLabs();
  }, []);

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
      labId: '',
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
          <div key={head.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select defaultValue={head.id}>
              <SelectTrigger>
                <SelectValue placeholder="Select a head" />
              </SelectTrigger>
              <SelectContent>
                {heads.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div>
              <Label htmlFor={`budget-code-${head.id}`}>Budget Code</Label>
              <Input
                id={`budget-code-${head.id}`}
                value={allocations[head.id]?.budgetCode || ''}
                onChange={(e) => handleAllocationChange(head.id, 'budgetCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`analysis-code-${head.id}`}>Analysis Code</Label>
              <Input
                id={`analysis-code-${head.id}`}
                value={allocations[head.id]?.analysisCode || ''}
                onChange={(e) => handleAllocationChange(head.id, 'analysisCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`total-sanctioned-${head.id}`}>Total Sanctioned Amount</Label>
              <Input
                id={`total-sanctioned-${head.id}`}
                value={
                  allocations[head.id]?.allocationAmount || ''
                }
                onChange={(e) => handleAllocationChange(head.id, 'allocationAmount', e.target.value)}
              />
            </div>
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
                    <Select
                      value={item.labId}
                      onValueChange={(value) => handleItemChange(head.id, index, 'labId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lab" />
                      </SelectTrigger>
                      <SelectContent>
                        {labs.map(lab => <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
