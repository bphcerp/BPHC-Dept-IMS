"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { FilterBar } from "@/components/handouts/filterBar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { STATUS_COLORS } from "@/components/handouts/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { AssignICDialog } from "@/components/handouts/updateICDialog";
import { AssignDCADialog } from "@/components/handouts/assignDCADialog";
import { SetDeadlineDialog } from "@/components/handouts/setDeadline";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

interface HandoutsDCAcon {
  reviewerEmail: string;
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  reviewerName: string | null;
  professorName: string;
  submittedOn: string;
  status: string;
}

export const DCAConvenerHandouts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>(
    []
  );
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [filteredHandouts, setFilteredHandouts] = useState<HandoutsDCAcon[]>(
    []
  );

  const [isICDialogOpen, setIsICDialogOpen] = useState(false);
  const [isReviewerDialogOpen, setIsReviewerDialogOpen] = useState(false);
  const [currentHandoutId, setCurrentHandoutId] = useState<string | null>(null);
  const [selectedHandouts, setSelectedHandouts] = useState<string[]>([]);
  const [isBulkAssign, setIsBulkAssign] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateICMutation = useMutation({
    mutationFn: async ({
      id,
      icEmail,
      sendEmail,
    }: {
      id: string;
      icEmail: string;
      sendEmail: boolean;
    }) => {
      const response = await api.post<{ success: boolean }>(
        "/handout/dcaconvenor/updateIC",
        {
          id: id.toString(),
          icEmail,
          sendEmail,
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Instructor updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
    },
    onError: () => {
      toast.error("Failed to update instructor");
    },
  });

  const updateReviewerMutation = useMutation({
    mutationFn: async ({
      id,
      reviewerEmail,
      sendEmail,
    }: {
      id: string;
      reviewerEmail: string;
      sendEmail: boolean;
    }) => {
      const response = await api.post<{ success: boolean }>(
        "/handout/dcaconvenor/updateReviewer",
        {
          id: id.toString(),
          reviewerEmail,
          sendEmail,
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Reviewer assigned successfully");
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
    },
    onError: () => {
      toast.error("Failed to assign reviewer");
    },
  });

  const bulkUpdateReviewerMutation = useMutation({
    mutationFn: async ({
      ids,
      reviewerEmail,
      sendEmail,
    }: {
      ids: string[];
      reviewerEmail: string;
      sendEmail: boolean;
    }) => {
      // For each ID, call the updateReviewer endpoint
      const promises = ids.map((id) =>
        api.post<{ success: boolean }>("/handout/dcaconvenor/updateReviewer", {
          id: id.toString(),
          reviewerEmail,
          sendEmail,
        })
      );

      return Promise.all(promises);
    },
    onSuccess: async () => {
      toast.success(
        `Reviewer assigned to ${selectedHandouts.length} handouts successfully`
      );
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
      setSelectedHandouts([]);
    },
    onError: () => {
      toast.error("Failed to assign reviewer to some handouts");
    },
  });

  const {
    data: handouts,
    isLoading,
    isError,
  } = useQuery<HandoutsDCAcon[]>({
    queryKey: ["handouts-dca-convenor"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          success: boolean;
          handouts: HandoutsDCAcon[];
        }>("/handout/dcaconvenor/get");
        return response.data.handouts;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!handouts) return;

    localStorage.setItem("handouts DCA CONVENOR", JSON.stringify(handouts));

    let results = handouts;
    if (searchQuery) {
      results = results.filter(
        (handout) =>
          handout.courseName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          handout.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    results = results.filter((handout) => {
      const matchesCategory =
        activeCategoryFilters.length > 0
          ? activeCategoryFilters.includes(handout.category)
          : true;
      const matchesStatus =
        activeStatusFilters.length > 0
          ? activeStatusFilters.includes(handout.status)
          : true;
      return matchesCategory && matchesStatus;
    });

    setFilteredHandouts(results);
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, handouts]);

  const handlePencilClick = (handoutId: string, isReviewer: boolean) => {
    setCurrentHandoutId(handoutId);
    setIsBulkAssign(false);
    if (isReviewer) {
      setIsReviewerDialogOpen(true);
    } else {
      setIsICDialogOpen(true);
    }
  };

  const handleAssignIC = (email: string, sendEmail: boolean) => {
    if (!currentHandoutId) {
      toast.error("No handout selected");
      return;
    }

    updateICMutation.mutate({
      id: currentHandoutId,
      icEmail: email,
      sendEmail,
    });

    setIsICDialogOpen(false);
  };

  const handleAssignReviewer = (email: string, sendEmail: boolean) => {
    if (isBulkAssign) {
      if (selectedHandouts.length === 0) {
        toast.error("No handouts selected");
        return;
      }

      bulkUpdateReviewerMutation.mutate({
        ids: selectedHandouts,
        reviewerEmail: email,
        sendEmail,
      });
    } else {
      if (!currentHandoutId) {
        toast.error("No handout selected");
        return;
      }

      updateReviewerMutation.mutate({
        id: currentHandoutId,
        reviewerEmail: email,
        sendEmail,
      });
    }

    setIsReviewerDialogOpen(false);
  };

  const handleSelectHandout = (handoutId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedHandouts((prev) => [...prev, handoutId]);
    } else {
      setSelectedHandouts((prev) => prev.filter((id) => id !== handoutId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = filteredHandouts.map((handout) => handout.id);
      setSelectedHandouts(allIds);
    } else {
      setSelectedHandouts([]);
    }
  };

  const handleBulkAssignReviewer = () => {
    if (selectedHandouts.length === 0) {
      toast.error("No handouts selected");
      return;
    }

    setIsBulkAssign(true);
    setIsReviewerDialogOpen(true);
  };

  const isAllSelected =
    filteredHandouts.length > 0 &&
    selectedHandouts.length === filteredHandouts.length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error fetching handouts
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              DCA Convenor - Handouts
            </h1>
            <p className="mt-2 text-gray-600">2nd semester 2024-25</p>
            <div className="mt-2 flex gap-2">
              <SetDeadlineDialog />
              <Link to="/handout/summary">
                <Button
                  variant="outline"
                  className="hover:bg-primary hover:text-white"
                >
                  Summary
                </Button>
              </Link>
              {selectedHandouts.length > 0 && (
                <Button
                  variant="default"
                  className="bg-primary text-white"
                  onClick={handleBulkAssignReviewer}
                >
                  Assign Reviewer ({selectedHandouts.length})
                </Button>
              )}
            </div>
          </div>
          <div className="ml-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategoryFilters={activeCategoryFilters}
              onCategoryFilterChange={setActiveCategoryFilters}
              activeStatusFilters={activeStatusFilters}
              onStatusFilterChange={setActiveStatusFilters}
            />
          </div>
        </div>
      </div>

      <hr className="my-1 border-gray-300" />

      <div className="w-full overflow-x-auto bg-white shadow">
        <div className="inline-block min-w-full align-middle">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-12 px-4 py-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all handouts"
                  />
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Course Code
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Course Name
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Instructor Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Reviewer Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Submitted On
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredHandouts.length ? (
                filteredHandouts.map((handout) => (
                  <TableRow
                    key={handout.id}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="w-12 px-4 py-2">
                      <Checkbox
                        checked={selectedHandouts.includes(handout.id)}
                        onCheckedChange={(checked) =>
                          handleSelectHandout(handout.id, !!checked)
                        }
                        aria-label={`Select ${handout.courseName}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.courseCode}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.courseName}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.category}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center">
                        <span>{handout.professorName}</span>
                        <button
                          onClick={() => handlePencilClick(handout.id, false)}
                          className="ml-2 text-gray-500 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center">
                        <span>
                          {handout.reviewerName || "No reviewer assigned"}
                        </span>
                        <button
                          onClick={() => handlePencilClick(handout.id, true)}
                          className="ml-2 text-gray-500 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[handout.status]}>
                        {handout.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.submittedOn
                        ? new Date(handout.submittedOn).toLocaleDateString()
                        : "NA"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.status != "notsubmitted" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() =>
                            navigate(
                              `/handout/dcaconvenor/review/${handout.id}`
                            )
                          }
                        >
                          {handout.status === "reviewed" ? "Review" : "View"}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="cursor-not-allowed bg-white text-gray-500 opacity-50"
                        >
                          None
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="px-4 py-2 text-center">
                    No handouts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AssignICDialog
        isOpen={isICDialogOpen}
        setIsOpen={setIsICDialogOpen}
        onAssign={handleAssignIC}
      />

      <AssignDCADialog
        isOpen={isReviewerDialogOpen}
        setIsOpen={setIsReviewerDialogOpen}
        onAssign={handleAssignReviewer}
        isBulkAssign={isBulkAssign}
        selectedCount={selectedHandouts.length}
      />
    </div>
  );
};

export default DCAConvenerHandouts;
