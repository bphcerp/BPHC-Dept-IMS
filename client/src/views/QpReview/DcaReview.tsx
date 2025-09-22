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
  length?: string;
  remarks?: string;
  language?: string;
  solution?: string;
  coverLearning?: string;
  mixOfQuestions?: string;
}

interface ReviewData {
  Compre?: ReviewCriteria;
  MidSem?: ReviewCriteria;
  Others?: ReviewCriteria;
}

interface ApiResponse {
  success: boolean;
  data: {
    courseName: string;
    courseCode: string;
    review: ReviewData;
  };
}

export default function DcaReview() {
  const email = "f20240500@hyderabad.bits-pilani.ac.in";
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apiData, isLoading, isError } = useQuery({
    queryKey: [`qp-reviews-${id}`],
    queryFn: async () => {
      try {
        const response = await api.get(`/qp/getReviews/${email}/${id}`);
        console.log("Fetched reviews:", response.data);
        return response.data as ApiResponse;
      } catch (error) {
        console.error("Error fetching reviews:", error);
        toast.error("Failed to fetch reviews");
        throw error;
      }
    },
  });

  const goBack = () => {
    navigate(-1);
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

  // Extract data from nested structure
  const reviewData = apiData?.data?.review;
  const courseName = apiData?.data?.courseName;
  const courseCode = apiData?.data?.courseCode;

  // Helper function to validate and display scores
  const getScoreDisplay = (score: string | undefined) => {
    if (!score || score.trim() === '') {
      return { value: 'N/A', isInvalid: false, isEmpty: true };
    }
    
    const numScore = parseInt(score);
    // Handle invalid scores (like "33") by showing them with a warning
    if (isNaN(numScore) || numScore > 10) {
      return { value: score, isInvalid: true, isEmpty: false };
    }
    return { value: score, isInvalid: false, isEmpty: false };
  };

  // Helper function to get color class for scores
  const getScoreColorClass = (score: string | undefined) => {
    const scoreData = getScoreDisplay(score);
    
    if (scoreData.isEmpty) {
      return 'bg-gray-100 text-gray-500';
    }
    
    if (scoreData.isInvalid) {
      return 'bg-orange-100 text-orange-800 border border-orange-300';
    }
    
    const numScore = parseInt(score!);
    if (numScore >= 7) {
      return 'bg-green-100 text-green-800';
    } else if (numScore >= 4) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  // Helper function to format remarks with line breaks
  const formatRemarks = (remarks: string | undefined) => {
    if (!remarks || remarks.trim() === '') {
      return 'No remarks';
    }
    return remarks.trim();
  };

  // Create table data from review data - only include sections that exist
  const tableData = reviewData ? [
    // Only include sections that exist in the API response
    ...(reviewData.MidSem ? [{
      examType: "Mid Semester",
      examTypeKey: "MidSem",
      length: reviewData.MidSem.length,
      language: reviewData.MidSem.language,
      solution: reviewData.MidSem.solution,
      coverLearning: reviewData.MidSem.coverLearning,
      mixOfQuestions: reviewData.MidSem.mixOfQuestions,
      remarks: formatRemarks(reviewData.MidSem.remarks)
    }] : []),
    
    ...(reviewData.Compre ? [{
      examType: "Comprehensive Exam",
      examTypeKey: "Compre",
      length: reviewData.Compre.length,
      language: reviewData.Compre.language,
      solution: reviewData.Compre.solution,
      coverLearning: reviewData.Compre.coverLearning,
      mixOfQuestions: reviewData.Compre.mixOfQuestions,
      remarks: formatRemarks(reviewData.Compre.remarks)
    }] : []),
    
    ...(reviewData.Others ? [{
      examType: "Other Evaluations",
      examTypeKey: "Others",
      length: reviewData.Others.length,
      language: reviewData.Others.language,
      solution: reviewData.Others.solution,
      coverLearning: reviewData.Others.coverLearning,
      mixOfQuestions: reviewData.Others.mixOfQuestions,
      remarks: formatRemarks(reviewData.Others.remarks)
    }] : [])
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
          {courseName && (
            <p className="text-lg text-gray-600 mt-2">
              Course: {courseName} ({courseCode})
            </p>
          )}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Rating Scale:</strong> All scores are rated on a scale of 0-10, where <strong>10 represents the best</strong> and <strong>0 represents the worst</strong> performance.
            </p>
          </div>
          
          {/* Show which sections are available */}
          <div className="mt-2 p-2 bg-gray-50 rounded border">
            <p className="text-xs text-gray-600">
              <strong>Available Reviews:</strong> {
                Object.keys(reviewData || {}).join(', ') || 'None'
              }
            </p>
          </div>
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
              {tableData.length > 0 ? (
                tableData.map((review, index) => (
                  <TableRow
                    key={`${review.examTypeKey}-${index}`}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="px-4 py-2 font-medium">
                      {review.examType}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(review.length)}`}>
                        {getScoreDisplay(review.length).value}
                        {getScoreDisplay(review.length).isInvalid && (
                          <span className="ml-1" title="Invalid score (should be 0-10)">⚠️</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(review.language)}`}>
                        {getScoreDisplay(review.language).value}
                        {getScoreDisplay(review.language).isInvalid && (
                          <span className="ml-1" title="Invalid score (should be 0-10)">⚠️</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(review.solution)}`}>
                        {getScoreDisplay(review.solution).value}
                        {getScoreDisplay(review.solution).isInvalid && (
                          <span className="ml-1" title="Invalid score (should be 0-10)">⚠️</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(review.coverLearning)}`}>
                        {getScoreDisplay(review.coverLearning).value}
                        {getScoreDisplay(review.coverLearning).isInvalid && (
                          <span className="ml-1" title="Invalid score (should be 0-10)">⚠️</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(review.mixOfQuestions)}`}>
                        {getScoreDisplay(review.mixOfQuestions).value}
                        {getScoreDisplay(review.mixOfQuestions).isInvalid && (
                          <span className="ml-1" title="Invalid score (should be 0-10)">⚠️</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-xs">
                      <div className="whitespace-pre-line" title={review.remarks}>
                        {review.remarks}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-2 text-center text-gray-500">
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
