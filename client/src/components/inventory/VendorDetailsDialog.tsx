import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VendorDetailsDialog = ({
  open,
  onClose,
  vendorDetails,
}: {
  open: boolean;
  onClose: () => void;
  vendorDetails: any;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendor Details</DialogTitle>
        </DialogHeader>
        {vendorDetails ? (
          <div>
            <p>
              <strong>Name:</strong> {vendorDetails.name}
            </p>
            <p>
              <strong>Address:</strong> {vendorDetails.address}
            </p>
            <p>
              <strong>POC Name:</strong> {vendorDetails.pocName}
            </p>
            <p>
              <strong>Phone Number:</strong> {vendorDetails.phoneNumber}
            </p>
            <p>
              <strong>Email:</strong> {vendorDetails.email}
            </p>
          </div>
        ) : (
          <p>No vendor details available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VendorDetailsDialog;
