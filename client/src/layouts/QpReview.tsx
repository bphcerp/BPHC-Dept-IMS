import { AppSidebar } from "@/components/AppSidebar";
import { FileText } from "lucide-react";
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
                icon: <FileText/>,
                url: "/qpReview/dcarequests"
              },
              {
                title: "Faculty Review",
                icon: <FileText />,
                url: "/qpReview/facultyReview",
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
