# Faculty Contribution Module

This module allows faculty members to submit their contributions to the institute and for the HOD to review them.

## API Endpoints

-   `POST /contribution/submit`: Submit a new contribution.
    -   **Body:**
        -   `designation` (string): The designation of the faculty member.
        -   `startDate` (string): The start date of the contribution (YYYY-MM-DD).
        -   `endDate` (string): The end date of the contribution (YYYY-MM-DD).
        -   `facultyEmail` (string): The email of the faculty member.
-   `GET /contribution/all`: Get all contributions.
-   `POST /contribution/approve`: Approve a contribution.
    -   **Body:**
        -   `contributionId` (string): The ID of the contribution to approve.
-   `POST /contribution/reject`: Reject a contribution.
    -   **Body:**
        -   `contributionId` (string): The ID of the contribution to reject.