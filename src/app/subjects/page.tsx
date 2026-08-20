"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { SessionStartModal } from "@/components/session/SessionStartModal";

export default function SubjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useStudyStore();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-focus border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar onOpenNewSession={() => setIsStartModalOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          <SubjectManager />
        </main>
      </div>

      <MobileNav />

      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
    </div>
  );
}
