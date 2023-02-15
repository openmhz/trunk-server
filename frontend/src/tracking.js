
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search + location.hash,
      page_search: location.search,
      page_hash: location.hash,
    });
  }, [location]);
};