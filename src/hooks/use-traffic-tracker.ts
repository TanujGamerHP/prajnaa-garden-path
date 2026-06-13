import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useTrafficTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip tracking for admin panel, farmer portal, or if the path is unchanged
    if (
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/farmer-portal") ||
      currentPath === lastPath.current
    ) {
      return;
    }

    lastPath.current = currentPath;

    const trackVisit = async () => {
      try {
        // Retrieve geo data from sessionStorage if already fetched this session
        let geoData = sessionStorage.getItem("prajnaa_geo_cache");
        let parsedGeo = geoData ? JSON.parse(geoData) : null;

        if (!parsedGeo) {
          // Fetch from public IP geolocation API (no key required, returns JSON)
          const response = await fetch("https://ipapi.co/json/");
          if (response.ok) {
            const data = await response.json();
            // Safeguard to ensure we received proper details
            if (data && data.ip) {
              parsedGeo = {
                ip: data.ip,
                country: data.country_name || "Unknown Country",
                region: data.region || "Unknown Region",
                city: data.city || "Unknown City",
                isp: data.org || "Unknown ISP",
              };
              sessionStorage.setItem("prajnaa_geo_cache", JSON.stringify(parsedGeo));
            }
          }
        }

        // If fetch failed or rate-limited, fallback to generic
        if (!parsedGeo) {
          parsedGeo = {
            ip: "Unknown IP",
            country: "Unknown Country",
            region: "Unknown Region",
            city: "Unknown City",
            isp: "Unknown ISP",
          };
        }

        // Parse User Agent details
        const ua = navigator.userAgent;
        let browser = "Other";
        if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) {
          browser = "Chrome";
        } else if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Chromium")) {
          browser = "Safari";
        } else if (ua.includes("Firefox")) {
          browser = "Firefox";
        } else if (ua.includes("Edg")) {
          browser = "Edge";
        }

        let deviceType = "Desktop";
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          deviceType = ua.includes("iPad") || ua.includes("Tablet") ? "Tablet" : "Mobile";
        }

        // Write log entry to database
        const payload = {
          ip: parsedGeo.ip,
          country: parsedGeo.country,
          region: parsedGeo.region,
          city: parsedGeo.city,
          isp: parsedGeo.isp,
          path: currentPath,
          user_agent: ua,
          device_type: deviceType,
          browser: browser,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
        };

        // Note: Using standard table router, this maps to firestore collection 'traffic_logs'
        await supabase.from("traffic_logs").insert(payload);
      } catch (err) {
        console.error("[Traffic Tracker Error]:", err);
      }
    };

    // Debounce slightly to ensure page load stabilizes
    const timer = setTimeout(trackVisit, 800);
    return () => clearTimeout(timer);
  }, [location.pathname, user?.id]);
}
