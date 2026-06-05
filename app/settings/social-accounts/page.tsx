"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Instagram, Twitter, Facebook, Linkedin, Cloud, Music2, Check, X, Loader2, AlertCircle } from "lucide-react";
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

  // CRITICAL: Handle browser back-forward cache (bfcache)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted === true when page is restored from bfcache
      if (event.persisted) {
        setLoadingProviders({});
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const { data: connections } = useQuery({
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
      const res = await fetch(`/api/oauth/${providerId}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate OAuth');
      
      if (data.url) {
        // CRITICAL: Reset state BEFORE navigating away so bfcache doesn't capture loading=true
        setLoadingProviders(prev => ({ ...prev, [providerId]: false }));
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      console.error("Connect error:", err);
      alert(err.message || 'Connection failed');
    } finally {
      setLoadingProviders(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setLoadingProviders(prev => ({ ...prev, [providerId]: true }));
    try {
      const res = await fetch(`/api/oauth/${providerId}/disconnect`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect from server");
      await queryClient.invalidateQueries({ queryKey: ["user-connections"] });
    } catch (err: any) {
      console.error("Disconnect error:", err);
      alert(err.message || 'Disconnection failed');
    } finally {
      setLoadingProviders(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const isConnected = (id: string) => connections?.some((c: any) => c.provider === id && c.connected);

  return (
    <>
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center gap-3">
            <Check className="w-5 h-5 text-[#00ff88]" />
            <span className="text-[#00ff88]">Connected to {PROVIDERS.find(p => p.id === success)?.name}</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">
              Connection failed: {error === "token_exchange" ? "Token exchange failed" : 
                                error === "invalid_state" ? "Security state mismatch" :
                                "Internal server error"}. Please try again.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {PROVIDERS.map(provider => {
          const connected = isConnected(provider.id);
          const isPending = loadingProviders[provider.id] || false;
          return (
            <motion.div key={provider.id} layout
              className={`p-4 rounded-xl flex items-center justify-between bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] ${connected ? 'border-[rgba(0,255,136,0.2)]' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${provider.color}15` }}>
                  <provider.icon className="w-5 h-5" style={{ color: provider.color }} />
                </div>
                <div>
                  <h3 className="font-medium text-white">{provider.name}</h3>
                  <p className="text-sm text-white/40">{connected ? "Connected and ready to publish" : "Not connected"}</p>
                </div>
              </div>
              <Button variant={connected ? "outline" : "default"} size="sm" disabled={isPending}
                onClick={() => connected ? handleDisconnect(provider.id) : handleConnect(provider.id)}
                className={connected ? "border-white/10 text-white/60 hover:bg-white/5" : "bg-white/10 text-white hover:bg-white/20"}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : connected ? <><X className="w-4 h-4 mr-1" /> Disconnect</> : "Connect"}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export default function SocialAccountsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Social Accounts</h1>
        <p className="text-white/40 mb-8">Connect your accounts to publish directly from Prometheus. Tokens are encrypted with AES-256-GCM.</p>
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>}>
          <SocialAccountsContent />
        </Suspense>
      </div>
    </div>
  );
}
