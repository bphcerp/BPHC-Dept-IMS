import { AppSidebar } from "@/components/AppSidebar";
import { FileText } from "lucide-react";
import { Outlet } from "react-router-dom";

const QpReviewLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Faculty",
            items: [
              {
                title: "See Requests",
                icon: <FileText />,
                url: "/qpReview/ficSubmission",
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
          {
            title: "DCA Convenor",
            items: [
              {
                title: "Create Review Requests",
                icon: <FileText />,
                url: "/qpReview/dcaRequests",
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
