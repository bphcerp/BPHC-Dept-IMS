import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Field = {
    name: string;
    type: string;
};

const fieldTypes = [
    { value: "TEXT", label: "Text" },
    { value: "NUMBER", label: "Number" },
    { value: "DATE", label: "Date" },
    // Add more as needed
];

const FormTemplateCreate: React.FC = () => {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [fields, setFields] = useState<Field[]>([]);
    const [newField, setNewField] = useState<Field>({ name: "", type: "TEXT" });
    const navigate = useNavigate();

    const addField = () => {
        if (!newField.name.trim()) return;
        setFields([...fields, newField]);
        setNewField({ name: "", type: "TEXT" });
    };

    const handleFieldChange = (idx: number, key: keyof Field, value: string) => {
        setFields(fields =>
            fields.map((f, i) => (i === idx ? { ...f, [key]: value } : f))
        );
    };

    const removeField = (idx: number) => {
        setFields(fields => fields.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const mappedFields = fields.map((f, idx) => ({
            label: f.name,
            type: f.type,
            order: idx,
        }));
        try {
            await api.post("/allocation/builder/template/create", {
                name,
                description,
                fields: mappedFields,
            });
            toast.success("Template created!");
            navigate("/allocation/form-templates");
        } catch {
            toast.error("Failed to create template!");
        }
    };

    return (
        <div className="p-4 max-w-xl mx-auto mt-10">{/* Added mt-10 for more space at the top */}
            <h1 className="text-2xl font-bold mb-4">Create Form Template</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    placeholder="Template Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
                <Input
                    placeholder="Provide a brief description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />

                <div className="space-y-3">
                    {fields.map((field, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 border rounded p-2"
                            style={{ backgroundColor: "#fff" }} // Normal (white) for added fields
                        >
                            <Input
                                placeholder="Field Name"
                                value={field.name}
                                onChange={e => handleFieldChange(idx, "name", e.target.value)}
                                className="flex-1"
                            />
                            <select
                                value={field.type}
                                onChange={e => handleFieldChange(idx, "type", e.target.value)}
                                className="border rounded min-w-[120px] h-8 px-2 py-1"
                                style={{ appearance: "auto" }}
                            >
                                {fieldTypes.map(ft => (
                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                            </select>
                            <Button type="button" variant="destructive" onClick={() => removeField(idx)}>
                                ×
                            </Button>
                        </div>
                    ))}
                    {/* New field input always at the end */}
                    <div
                        className="flex items-center gap-2 border rounded p-4"
                        style={{ backgroundColor: "#f3f4f6", opacity: 0.5 }} // Fainter for not-yet-added
                    >
                        <Input
                            placeholder="Field Name"
                            value={newField.name}
                            onChange={e => setNewField(f => ({ ...f, name: e.target.value }))}
                            className="flex-1"
                        />
                        <select
                            value={newField.type}
                            onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}
                            className="border rounded min-w-[120px] h-8 px-2 py-1"
                            style={{ appearance: "auto" }}
                        >
                            {fieldTypes.map(ft => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                        </select>
                        <Button type="button" onClick={addField}>+</Button>
                    </div>
                </div>

                <Button type="submit">Save Template</Button>
            </form>
        </div>
    );
};

export default FormTemplateCreate;