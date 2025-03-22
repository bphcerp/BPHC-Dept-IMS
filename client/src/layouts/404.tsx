import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-7xl font-bold text-accent-foreground">404</h1>
        <p className="mt-4 text-xl font-semibold text-muted-foreground">
          Page Not Found
        </p>
        <p className="my-2 text-muted-foreground">
          The page you are looking for could not be found.
        </p>
        <Link to="/" className="mt-4 underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
