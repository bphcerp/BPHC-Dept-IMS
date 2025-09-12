import { AllocationFormTemplate } from '../../../../lib/src/types/allocationFormBuilder';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormTemplateViewerProps {
  template: AllocationFormTemplate;
}

const FormTemplateViewer = ({template}: FormTemplateViewerProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle> {template.name} </CardTitle>
            </CardHeader>

            <CardContent className='space-y-4'>
                {template.fields?.map((field) => {
                    switch(field.type) {
                        case "TEXT":
                        case "EMAIL":
                        case "NUMBER":
                        case "DATE":
                            return (
                                <div key={field.label}>
                                    <Label> {field.label} </Label>
                                    <Input type={field.type.toLowerCase()} disabled />
                                </div>
                            )
                        case "TEXTAREA":
                            return (
                                <div key={field.label}>
                                    <Label> {field.label} </Label>
                                    <Textarea disabled />
                                </div>
                            )
                        case "CHECKBOX":
                            return (
                                <div key={field.label} className='flex items-center space-x-2'>
                                    <Checkbox id={field.label} disabled />
                                    <Label htmlFor={field.label}> {field.label} </Label>
                                </div>
                            )
                        case "RADIO":
                            return (
                                <div key={field.label}>
                                    <Label> {field.label} </Label>
                                    <RadioGroup disabled>
                                        {field.options?.map((option) => (
                                            <div key={field.label} className='flex items-center space-x-2'>
                                                <RadioGroupItem value={option.value} id={option.label}/>
                                                <Label htmlFor={option.label}> {option.label} </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )
                        case "DROPDOWN":
                            return (
                                <div key={field.label}>
                                    <Label> {field.label} </Label>
                                    <Select disabled>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((option) => (
                                                <SelectItem key={option.label} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )
                        case "PREFERENCE":
                            return (
                                <div key={field.label}>
                                    <Label> {field.label} </Label>
                                    <p className='text-sm text-muted-foreground'> Preference fields will be displayed as a list of options that can be ranked by the user. </p>
                                </div>
                            )
                        default:
                            return null;
                    }
                })}
            </CardContent>
        </Card>
    );
};

export default FormTemplateViewer;