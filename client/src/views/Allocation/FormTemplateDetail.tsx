import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormTemplateViewer from "@/components/allocation/FormTemplateViewer";
import { AllocationFormTemplate } from "../../../../lib/src/types/allocationFormBuilder";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

const FormTemplateDetail = () => {
    const { id } = useParams();
    const [template, setTemplate] = useState<AllocationFormTemplate | null>(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get(`/allocation/builder/template/get/${id}`);
                setTemplate(response.data);
            } catch (error) {
                console.error("Error fetching form template:", error);
                toast.error("Error fetching form template!");
            }
        };

        fetchTemplate();
    }, [id]);

    if (!template) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6"> 
            <FormTemplateViewer template={template}/>
        </div>
    );
};

export default FormTemplateDetail;