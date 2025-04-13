import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { NewCategoryRequest, Category } from "@/views/Inventory/types";

interface AddInventoryCategoryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddCategory: (newCategory: NewCategoryRequest) => void;
  editInitialData?: Category;
}

const AddInventoryCategoryDialog = ({ isOpen, setIsOpen, onAddCategory, editInitialData }: AddInventoryCategoryDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
      if (editInitialData){
        setCode(editInitialData.code)
        setName(editInitialData.name)
      }
    },[editInitialData])

  const handleSubmit = () => {
    if (name) {
      onAddCategory({ name,code, type: "Inventory" });
      setName("");
      setCode("")
      setIsOpen(false);
    } else {
      toast.error("Category name is required");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {editInitialData ? (
          <Button variant="outline" className="text-blue-500 hover:text-blue-700 hover:bg-background">
            Edit Inventory Category
          </Button>
        ) : (
          <Button>Add Inventory Category</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editInitialData ? "Edit Inventory Category" : "Add Inventory Category"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div>
            <Label htmlFor="category-name">Category Name</Label>
            <Input required id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="category-code">Category Code</Label>
            <Input required id="category-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit">{editInitialData ? "Edit Category" : "Add Category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryCategoryDialog;
