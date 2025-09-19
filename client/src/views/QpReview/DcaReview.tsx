import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";


interface ReviewCriteria {
  length: string;
  remarks: string;
  language: string;
  solution: string;
  coverLearning: string;
  mixOfQuestions: string;
}


interface ReviewData {
  Compre: ReviewCriteria;
  MidSem: ReviewCriteria;
  Others: ReviewCriteria;
}


export default function DcaReview() {
  const email = "f20240500@hyderabad.bits-pilani.ac.in";
  const { id } = useParams();
  const navigate = useNavigate();


  const { data: reviewData, isLoading, isError } = useQuery({
    queryKey: [`qp-reviews-${id}`],
    queryFn: async () => {
      try {
        const response = await api.get(`/qp/getReviews/${email}/${id}`);
        console.log("Fetched reviews:", response.data);
        return response.data.data as ReviewData;
      } catch (error) {
        console.error("Error fetching reviews:", error);
        toast.error("Failed to fetch reviews");
        throw error;
      }
    },
  });


  const goBack = () => {
    navigate("/qpReview/dcarequests");
  };


  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );


  if (isError)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error fetching reviews
      </div>
    );


  // Create table data from review data
  const tableData = reviewData ? [
    {
      examType: "Comprehensive Exam",
      examTypeKey: "Compre",
      length: reviewData.Compre.length,
      language: reviewData.Compre.language,
      solution: reviewData.Compre.solution,
      coverLearning: reviewData.Compre.coverLearning,
      mixOfQuestions: reviewData.Compre.mixOfQuestions,
      remarks: reviewData.Compre.remarks || "No remarks"
    },
    {
      examType: "Mid Semester",
      examTypeKey: "MidSem",
      length: reviewData.MidSem.length,
      language: reviewData.MidSem.language,
      solution: reviewData.MidSem.solution,
      coverLearning: reviewData.MidSem.coverLearning,
      mixOfQuestions: reviewData.MidSem.mixOfQuestions,
      remarks: reviewData.MidSem.remarks || "No remarks"
    },
    {
      examType: "Other Evaluations",
      examTypeKey: "Others",
      length: reviewData.Others.length,
      language: reviewData.Others.language,
      solution: reviewData.Others.solution,
      coverLearning: reviewData.Others.coverLearning,
      mixOfQuestions: reviewData.Others.mixOfQuestions,
      remarks: reviewData.Others.remarks || "No remarks"
    }
  ] : [];


  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            className="size-sm flex items-center mb-4"
          >
            <ChevronLeft className="mr-1" size={16} />
            Back to Dashboard
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Question Paper Review Details
          </h1>
        </div>
      </div>


      <hr className="my-1 border-gray-300" />


      <div className="w-full overflow-x-auto bg-white shadow">
        <div className="inline-block min-w-full align-middle">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-2 text-left">Exam Type</TableHead>
                <TableHead className="px-4 py-2 text-left">Paper Length</TableHead>
                <TableHead className="px-4 py-2 text-left">Language & Clarity</TableHead>
                <TableHead className="px-4 py-2 text-left">Solution Approach</TableHead>
                <TableHead className="px-4 py-2 text-left">Learning Coverage</TableHead>
                <TableHead className="px-4 py-2 text-left">Question Mix</TableHead>
                <TableHead className="px-4 py-2 text-left">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {tableData.length ? (
                tableData.map((review, index) => (
                  <TableRow
                    key={index}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="px-4 py-2 font-medium">
                      {review.examType}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(review.length) >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(review.length) >= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.length}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(review.language) >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(review.language) >= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.language}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(review.solution) >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(review.solution) >= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.solution}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(review.coverLearning) >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(review.coverLearning) >= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.coverLearning}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseInt(review.mixOfQuestions) >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(review.mixOfQuestions) >= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.mixOfQuestions}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-xs">
                      <div className="truncate" title={review.remarks}>
                        {review.remarks}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-2 text-center">
                    No review data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
