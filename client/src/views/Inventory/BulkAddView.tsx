import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UploadStage } from "./UploadStage";
import { toast } from "sonner";
import { AlertCircle, Check } from "lucide-react";
import api from "@/lib/axios-instance";
import { AxiosError } from "axios";

const BulkAddView = () => {
    const [stage, setStage] = useState(1);
    const totalStages = 3;
    const labels = ['Upload', 'Processing Data', 'Finish'];

    // Calculate progress fill (from stage 1 to stage 4)
    const progressPercent = ((stage - 1) / (totalStages - 1)) * 100;

    const handleNextStage = (stageToGoTo: number) => {
        setStage(Math.min(stageToGoTo, totalStages));
    };

    const handleFileUpload = async (file: File, labId: string) => {

        handleNextStage(2)

        const formData = new FormData()
        formData.append('excel', file)
        formData.append('labId', labId)

        api.post('/inventory/items/excel',formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(() => {
            handleNextStage(3)
            toast.success('Data uploaded successfully')
        })
        .catch((err) => {
            handleNextStage(1)
            const errMessage = ((err as AxiosError).response?.data as { message: string }).message ?? (err as AxiosError).response?.data
            toast.error(errMessage ?? (err as Error).message ?? "Error uploading file")
            console.error(errMessage ?? (err as Error).message)
        })
    }

    return (
        <div className="relative flex flex-col p-5 space-y-10 h-full">
            <div className="grid grid-cols-3">
                <div className="flex space-x-2 text-red-600">
                    <AlertCircle size={20} />
                    <span className="text-xs">Vendor Id and Category Code Columns must be present in the excel and should match with entries in the Settings page.</span>
                </div>
                <span className="text-3xl text-primary text-center">
                    Bulk Add Items from Excel
                </span>

                <Link className="flex justify-end" to="/inventory/items/add-item">
                    <Button>Add Single Item</Button>
                </Link>
            </div>

            <div className="flex flex-col space-y-14 px-5 h-full">
                {/* Progress bar container */}
                <div className="relative w-full pt-8">
                    {/* Track */}
                    <div className="relative h-2 bg-secondary rounded-full" />
                    {/* Animated fill */}
                    <div
                        className="absolute z-2 h-2 bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                    {/* Stage circles with labels on top */}
                    {Array.from({ length: totalStages }, (_, index) => {
                        const step = index + 1;
                        const leftPercent = (index / (totalStages - 1)) * 100;
                        return (
                            <div
                                key={step}
                                className="absolute flex flex-col items-center"
                                style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)', top: -10 }}
                            >
                                {/* Label above the circle */}
                                <div className="mb-2 text-gray-500 text-center">
                                    {labels[index]}
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${step <= stage ? 'bg-primary' : 'bg-secondary'
                                        }`}
                                >
                                    <span className="text-white">{step}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {stage === 1 ? <UploadStage onSubmit={async (file, selectedLab) => {
                    toast.info("Uploading...")
                    handleFileUpload(file, selectedLab.id)
                }} /> : stage === 2 ? <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary"></div>
                </div> : (
                    <div className="flex flex-col items-center space-y-4">
                        <Check className="w-16 h-16 text-green-500" />
                        <span className="text-xl font-semibold text-center text-primary">
                            Data has been successfully uploaded!
                        </span>
                        <Link to='/inventory/items'><Button>Go back to items</Button></Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkAddView;