import { AppSidebar } from "@/components/AppSidebar";
import { FileText } from "lucide-react";
import { Outlet } from "react-router-dom";

const QpReviewLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "FIC Submission",
            items: [
              {
                title: "FicSubmission",
                icon: <FileText />,
                url: "/qpReview/ficSubmission",
              },
            ],
          },
          {
            title: "DCA Requests",
            items: [
              {
                title: "DCA Requests",
                icon: <FileText />,
                url: "/qpReview/dcaRequests",
              },
            ],
          },
          {
            title: "Faculty Review",
            items: [
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
