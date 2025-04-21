import { AppSidebar } from "@/components/AppSidebar";
import { FileText } from "lucide-react";
import { Outlet } from "react-router-dom";

const QpReviewLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Faculty In Charge",
            items: [
              {
                title: "See Requests",
                icon: <FileText />,
                url: "/qpReview/ficSubmission",
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
          {
            title: "DCA Member",
            items: [
              {
                title: "DCA Member Review",
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
