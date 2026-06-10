import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/farmer-portal/")({
  beforeLoad: () => {
    throw redirect({ to: "/farmer-portal/dashboard" });
  },
});
