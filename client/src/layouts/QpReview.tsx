import { AppSidebar } from "@/components/AppSidebar";
import { FileText, FileQuestion } from "lucide-react";
import { Outlet } from "react-router-dom";

const QpReviewLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "QpReview",
            items: [
              {
                title: "FicSubmission",
                icon: <FileText />,
                url: "/qpReview/ficSubmission",
              },
              {
                title: "DCARequests",
                icon: <FileText />,
                url: "/qpReview/dcarequests",
              },
              {
                title: "DcaRequestList",
                icon: <FileQuestion />,
                url: "/qpReview/dcaRequestList",
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default QpReviewLayout;
