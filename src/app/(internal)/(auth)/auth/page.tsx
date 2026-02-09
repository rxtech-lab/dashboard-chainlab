import React from "react";
import { Metadata } from "next";
import AuthenticationModal from "@/components/pages/auth/AuthenticationModal";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication page",
};

export default function page() {
  return (
    <div className="w-full h-full">
      <AuthenticationModal />
    </div>
  );
}
