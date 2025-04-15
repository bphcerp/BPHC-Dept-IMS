import { DropzoneOptions, useDropzone } from 'react-dropzone'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from '@/lib/axios-instance'
import { Laboratory } from 'node_modules/lib/src/types/inventory'

export const UploadStage = ({ onSubmit }: { onSubmit: (file: File, selectedLab: Laboratory) => void }) => {
    const [labs, setLabs] = useState<Laboratory[]>([])
    const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null)

    useEffect(() => {
        api("/inventory/labs/get").then(({ data }) => setLabs(data))
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        disabled: !selectedLab,
        maxFiles: 1,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        onDrop: (incomingFiles: File[]) => {
            onSubmit(incomingFiles[0], selectedLab!)
        }
    } as unknown as DropzoneOptions)

    return (
        <>
            <div className="grid grid-cols-3 gap-4">
                <div className='flex flex-col items-center space-y-2'>
                    <Label>Lab</Label>
                    <Select onValueChange={(value) => setSelectedLab(labs.find(lab => lab.id === value) || null)}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select Lab" />
                        </SelectTrigger>
                        <SelectContent>
                            {labs.map((lab) => (
                                <SelectItem key={lab.id} value={lab.id}>
                                    {lab.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex flex-col items-center space-y-2'>
                    <Label>Faculty In-charge</Label>
                    <Input disabled value={selectedLab?.facultyInCharge?.name ?? "None Specified"} />
                </div>
                <div className='flex flex-col items-center space-y-2'>
                    <Label>Technician In-charge</Label>
                    <Input disabled value={selectedLab?.technicianInCharge?.name ?? "None Specified"} />
                </div>
            </div>
            <div {...getRootProps()} className={`flex w-full grow items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 ${selectedLab ? "cursor-pointer hover:border-primary hover:text-primary" : "cursor-not-allowed"} transition-all`}>
                <input required {...getInputProps()} hidden />
                {selectedLab ? isDragActive ? <p className="text-lg font-medium">Drop the file here</p> : <div>
                    <p className="text-lg font-medium">Drag and drop your file here</p>
                    <p className="text-sm mt-2">or click to upload</p>
                </div> : <div>
                    <p className="text-lg font-medium">Upload not active</p>
                    <p className='text-sm mt-2'>Please select a lab to proceed</p>
                </div>}
            </div>
        </>
    )
}