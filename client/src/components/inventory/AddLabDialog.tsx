import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import api from "@/lib/axios-instance";
import { Laboratory, Faculty, Staff, NewLaboratoryRequest } from "@/views/Inventory/types";
import { Member } from "../admin/MemberList";
import { useQuery } from "@tanstack/react-query";

interface AddLabDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddLab: (newLab: NewLaboratoryRequest, edit?: boolean) => void;
  editInitialData?: Laboratory
}

const AddLabDialog = ({ isOpen, setIsOpen, onAddLab, editInitialData }: AddLabDialogProps) => {
  const [technicians, setTechnicians] = useState<Staff[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const { data: members, isSuccess } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await api.get<Member[]>("/admin/member/search");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isSuccess && members) {
      setTechnicians(members.filter((member: Member) => member.type === "staff") as Staff[]);
      setFaculties(members.filter((member: Member) => member.type === "faculty") as Faculty[]);
    }
  }, [isSuccess, members])

  const { Field, Subscribe, handleSubmit, reset } = useForm({
    defaultValues: {
      name: editInitialData?.name ?? "",
      code: editInitialData?.code ?? "",
      location: editInitialData?.location ?? "",
      technicianInChargeEmail: editInitialData?.technicianInCharge.email ?? "",
      facultyInChargeEmail: editInitialData?.facultyInCharge.email ?? "",
    } as NewLaboratoryRequest,
    onSubmit: ({ value: data, formApi: form }) => {
      if (!data.name || !data.code || !data.location || !data.technicianInChargeEmail || !data.facultyInChargeEmail) {
        toast.error("Some fields are missing");
        return;
      }

      const dirtyFields = Object.entries(form.state.fieldMetaBase).filter(([_key, value]) => value.isDirty).map(([key]) => key)

      if (editInitialData) onAddLab(Object.fromEntries(Object.entries(data).filter(([key]) => dirtyFields.includes(key))) as NewLaboratoryRequest, true)
      else onAddLab(data)
      setIsOpen(false);
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        reset();
      }}
    >
      <DialogTrigger asChild>
        {editInitialData ? <Button variant="outline" className="text-blue-500 hover:text-blue-700 hover:bg-background">Edit Lab</Button> : <Button>Add Lab</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editInitialData ? "Edit Lab" : "Add New Lab"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          id="lab-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Field name="name">
            {({ state, handleChange, handleBlur }) => (
              <>
                <Label htmlFor="lab-name">Lab Name</Label>
                <Input
                  id="lab-name"
                  required
                  value={state.value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                />
              </>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field name="code">
              {({ state, handleChange, handleBlur }) => (
                <>
                  <Label htmlFor="lab-code">Lab Code</Label>
                  <Input
                    id="lab-code"
                    required
                    maxLength={4}
                    value={state.value}
                    onChange={(e) => handleChange(e.target.value.toUpperCase())}
                    onBlur={handleBlur}
                  />
                </>
              )}
            </Field>
            <Field name="location">
              {({ state, handleChange, handleBlur }) => (
                <>
                  <Label htmlFor="lab-location">Lab Location</Label>
                  <Input
                    id="lab-location"
                    required
                    pattern="^[A-Z]-\d{3}[A-Z]?$"
                    title="Location of the lab (Ex. J-106, W-101)"
                    value={state.value!}
                    onChange={(e) => handleChange(e.target.value.toUpperCase())}
                    onBlur={handleBlur}
                  />
                </>
              )}
            </Field>
          </div>
          <Field name="technicianInChargeEmail">
            {({ state, handleChange }) => (
              <>
                <Label htmlFor="technician-in-charge">Technician In Charge</Label>
                <Select
                  value={state.value}
                  onValueChange={(value) => handleChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <span>
                      {state.value
                        ? technicians.find((tech) => tech.email === state.value)
                          ?.name
                        : "Select Technician In Charge"}
                    </span>
                  </SelectTrigger>
                  <SelectContent id="technician-in-charge">
                    {technicians.map((tech) => (
                      <SelectItem key={tech.email} value={tech.email}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </Field>
          <Field name="facultyInChargeEmail">
            {({ state, handleChange }) => (
              <>
                <Label htmlFor="faculty-in-charge">Faculty In Charge</Label>
                <Select
                  value={state.value}
                  onValueChange={(value) => handleChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <span>
                      {state.value
                        ? faculties.find((faculty) => faculty.email === state.value)
                          ?.name
                        : "Select Faculty In Charge"}
                    </span>
                  </SelectTrigger>
                  <SelectContent id="technician-in-charge">
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.email} value={faculty.email}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </Field>
        </form>
        <DialogFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Subscribe
            selector={(state) => [state.canSubmit]}
            children={([canSubmit]) => (
              <Button disabled={!canSubmit} form="lab-add-form">
                {editInitialData ? "Edit Lab" : "Add Lab"}
              </Button>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLabDialog;
