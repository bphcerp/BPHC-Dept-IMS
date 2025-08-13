// TODO: use tanstack form, use zod for validation, and handle form submission with a proper API call
// TODO: fetch HoD and Convener details from the server

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const RegisterNewSemester = () => {
    const [semester, setSemester] = useState(1);
    const [academicYear, setAcademicYear] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [hod, setHod] = useState("");
    const [convener, setConvener] = useState("");
    const [committee, setCommittee] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: handle form submission logic
        alert("Semester registered! (stub)");
    };

    return (
        <div className="registerNewSemesterContainer p-4 flex flex-col space-y-8">
            <h1 className="text-3xl font-bold text-primary">Register New Semester</h1>
            <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-2 text-primary">Semester Details</h2>
                <section className="semesterDetails grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="semester">Semester</Label>
                        <Input id="semester" type="number" min={1} max={8} value={semester} onChange={e => setSemester(Number(e.target.value))} required />
                    </div>
                    <div>
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Input id="academicYear" type="text" placeholder="2025-2026" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="hod">
                            HoD
                            <span className="text-xs text-zinc-600">Auto filled</span>
                        </Label>
                        <Input readOnly id="hod" type="text" value={hod} onChange={e => setHod(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="convener">DCA Convener ( Auto Filled )</Label>
                        <Input readOnly id="convener" type="text" value={convener} onChange={e => setConvener(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="committee">DCA Committee (comma separated)</Label>
                        <Input id="committee" type="text" value={committee} onChange={e => setCommittee(e.target.value)} />
                    </div>
                </section>
                <section className="coursesSection flex flex-col space-y-2">
                    <h2 className="text-xl font-semibold text-primary">Courses</h2>
                    <span>Will be loaded</span>
                </section>               
            </form>
            <Button type="submit">Register Semester</Button>
        </div>
    );
};

export default RegisterNewSemester;
