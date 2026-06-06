"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Instagram, Twitter, Facebook, Linkedin, Cloud, Music2, Check, X, AlertCircle } from "lucide-react";
import { PrometheusLoader } from "@/components/loading/PrometheusLoader";
import { Button } from "@/components/ui/button";

const PROVIDERS = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "#00f2ea" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F" },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "#1DA1F2" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "google_drive", name: "Google Drive", icon: Cloud, color: "#4285F4" },
  { id: "dropbox", name: "Dropbox", icon: Cloud, color: "#0061FF" },
];

function SocialAccountsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  
  // P0 Fix: Per-provider loading states using a Record for absolute isolation.
  const [loadingProviders, setLoadingProviders] = useState<Record<string, boolean>>({});

  const { data: connections, isLoading } = useQuery({
    queryKey: ["user-connections"],
    queryFn: async () => {
      const res = await fetch("/api/user/connections");
      if (!res.ok) throw new Error("Failed to fetch connections");
      return res.json();
    },
  });

  const handleConnect = async (providerId: string) => {
    setLoadingProviders(prev => ({ ...prev, [providerId]: true }));
    try {
      const res = await fetch(`/api/auth/connect/${providerId}`);
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
    } catch (e) {
      console.error(e);
      setLoadingProviders(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setLoadingProviders(prev => ({ ...prev, [providerId]: true }));
    try {
      await fetch(`/api/auth/disconnect/${providerId}`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["user-connections"] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProviders(prev => ({ ...prev, [providerId]: false }));
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><PrometheusLoader size="md" /></div>;

  return (
    <div className="grid gap-4">
      {PROVIDERS.map((provider) => {
        const connected = connections?.some((c: any) => c.provider === provider.id && c.connected);
        const isPending = loadingProviders[provider.id];

        return (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10" style={{ color: provider.color }}>
                <provider.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{provider.name}</h3>
                <p className="text-xs text-white/40">{connected ? "Connected" : "Not connected"}</p>
              </div>
            </div>
            <Button variant={connected ? "outline" : "default"} size="sm" disabled={isPending}
              onClick={() => connected ? handleDisconnect(provider.id) : handleConnect(provider.id)}
              className={connected ? "border-white/10 text-white/60 hover:bg-white/5" : "bg-white/10 text-white hover:bg-white/20"}>
              {isPending ? <PrometheusLoader size="sm" /> : connected ? <><X className="w-4 h-4 mr-1" /> Disconnect</> : "Connect"}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function SocialAccountsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Social Accounts</h1>
        <p className="text-white/40 mb-8">Connect your accounts to publish directly from Prometheus. Tokens are encrypted with AES-256-GCM.</p>
        <Suspense fallback={<div className="flex justify-center p-10"><PrometheusLoader size="md" /></div>}>
          <SocialAccountsContent />
        </Suspense>
      </div>
    </div>
  );
}
