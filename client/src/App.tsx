import Providers from "@/components/Providers";
import Routing from "@/components/Routing";
import { useState, useEffect } from "react";

const App = () => {
  const isStaging =
    import.meta.env.VITE_IS_STAGING === "true" ||
    import.meta.env.VITE_IS_STAGING === true;

  const STAGING_WARNING_TIMEOUT = 2 * 60 * 60 * 1000;
  const SESSION_KEY = "stagingWarningClosedAt";

  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isStaging) return;
    const closedAt = sessionStorage.getItem(SESSION_KEY);
    if (!closedAt) {
      setShowWarning(true);
      return;
    }
    const closedTime = Number(closedAt);
    if (isNaN(closedTime) || Date.now() - closedTime > STAGING_WARNING_TIMEOUT) {
      setShowWarning(true);
    }
  }, [isStaging]);

  const handleCloseWarning = () => {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    setShowWarning(false);
  };

  return (
    <>
      {isStaging && showWarning && (
        <div className="absolute z-50 flex w-full items-center justify-center border-b border-yellow-400 bg-yellow-100 px-4 py-2 text-yellow-900">
          <span className="mr-2 font-semibold">Staging Environment</span>
          <span className="group relative cursor-pointer underline decoration-dotted">
            <span>Hover for details</span>
            <span className="pointer-events-none absolute left-1/2 mt-2 w-max -translate-x-1/2 rounded bg-yellow-200 px-3 py-2 text-sm text-yellow-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              You are viewing a staging instance. For production, please use the
              official site.
            </span>
          </span>
          <button
            className="ml-4 rounded bg-yellow-300 px-2 py-1 text-xs font-semibold text-yellow-900 hover:bg-yellow-400 transition"
            onClick={handleCloseWarning}
            aria-label="Close staging warning"
          >
            Close
          </button>
        </div>
      )}
      <Providers>
        <Routing />
      </Providers>
    </>
  );
};

export default App;
