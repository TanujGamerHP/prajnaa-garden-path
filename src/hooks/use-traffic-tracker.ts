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
          // 1. Fetch IP & ISP details from ipapi.co (as baseline)
          let baselineGeo: any = null;
          try {
            const response = await fetch("https://ipapi.co/json/");
            if (response.ok) {
              const data = await response.json();
              if (data && data.ip) {
                baselineGeo = {
                  ip: data.ip,
                  country: data.country_name || "Unknown Country",
                  region: data.region || "Unknown Region",
                  city: data.city || "Unknown City",
                  isp: data.org || "Unknown ISP",
                };
              }
            }
          } catch (e) {
            console.warn("[Traffic Tracker] Baseline IP fetch failed:", e);
          }

          if (!baselineGeo) {
            baselineGeo = {
              ip: "Unknown IP",
              country: "Unknown Country",
              region: "Unknown Region",
              city: "Unknown City",
              isp: "Unknown ISP",
            };
          }

          // 2. Attempt exact device location using Geolocation API
          let exactGeo: any = null;
          if (typeof navigator !== "undefined" && navigator.geolocation) {
            try {
              // Wrap navigator.geolocation.getCurrentPosition in a promise with a timeout
              const position = await new Promise<any>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 4500, // wait up to 4.5 seconds for user to allow and GPS lock
                  maximumAge: 600000,
                });
              });

              const { latitude, longitude } = position.coords;
              
              // 3. Call reverse geocoder API to get exact city/region/country
              const geoResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                exactGeo = {
                  city: geoData.city || geoData.locality || "Unknown City",
                  region: geoData.principalSubdivision || "Unknown Region",
                  country: geoData.countryName || "Unknown Country",
                };
              }
            } catch (geoErr) {
              console.log("[Traffic Tracker] Exact geolocation unavailable or permission denied:", geoErr);
            }
          }

          // Merge exact geo if found, else keep IP geolocation details
          parsedGeo = {
            ip: baselineGeo.ip,
            isp: baselineGeo.isp,
            city: exactGeo ? exactGeo.city : baselineGeo.city,
            region: exactGeo ? exactGeo.region : baselineGeo.region,
            country: exactGeo ? exactGeo.country : baselineGeo.country,
          };

          // Cache so we don't query / prompt again in this session
          sessionStorage.setItem("prajnaa_geo_cache", JSON.stringify(parsedGeo));
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

        // Robust Device Type detection (handles Desktop, Mobile, Tablet, iPads in Desktop mode)
        let deviceType = "Desktop";
        const isTouch = ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) || 
                        (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
        const width = typeof window !== "undefined" ? (window.screen.width || window.innerWidth || 1024) : 1024;
        
        if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|Opera Mini/i.test(ua)) {
          if (/iPad|Tablet/i.test(ua) || (isTouch && width >= 768)) {
            deviceType = "Tablet";
          } else {
            deviceType = "Mobile";
          }
        } else if (isTouch && width < 1024) {
          if (width < 768) {
            deviceType = "Mobile";
          } else {
            deviceType = "Tablet";
          }
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
