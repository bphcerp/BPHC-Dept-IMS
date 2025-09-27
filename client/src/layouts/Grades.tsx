import { AppSidebar } from "@/components/AppSidebar";
import { permissions } from "lib";
import { FileText, Upload, Users } from "lucide-react";
import { Outlet } from "react-router-dom";

const GradesLayout = () => {
    return (
        <>
            <AppSidebar
                items={[
                    {
                        title: "Grade Management",
                        items: [
                            {
                                title: "Upload Excel",
                                icon: <Upload />,
                                url: "/grades/upload",
                                requiredPermissions: [permissions["/grades/upload"]],
                            },
                            {
                                title: "Manage Grades",
                                icon: <FileText />,
                                url: "/grades/manage",
                                requiredPermissions: [permissions["/grades/manage"]],
                            },
                            {
                                title: "Supervisor",
                                icon: <Users />,
                                url: "/grades/supervisor",
                                requiredPermissions: [permissions["/grades/supervisor"]],
                            },
                        ],
                    },
                ]}
            />
            <Outlet />
        </>
    );
};

export default GradesLayout;
