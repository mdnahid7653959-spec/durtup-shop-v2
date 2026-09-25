import React, { useState, useEffect } from "react";
import { 
  Code2, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Play, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  Terminal, 
  Layers, 
  Zap, 
  Eye, 
  EyeOff,
  ExternalLink,
  BookOpen,
  Boxes,
  HelpCircle,
  Clock
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerApi() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // Live API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/api/reseller/products");
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("GET");
  const [requestBody, setRequestBody] = useState<string>(
`{
  "product_id": "297705",
  "quantity": 1,
  "customer_selling_price": 1250,
  "delivery_area": "inside_dhaka",
  "customer_name": "আব্দুল করিম",
  "customer_phone": "01712345678",
  "customer_address": "হাউজ #৪, রোড #১০, ধানমন্ডি, ঢাকা",
  "customer_city": "Dhaka",
  "reseller_shop_name": "Smart Bazar BD",
  "notes": "জরুরি পার্সেল"
}`
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://durtup.shop";

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner")
      .then((p) => {
        setProfile(p);
        setWebhookUrl(p.webhookUrl || "");
        setLoading(false);
      });
  }, [user, authProfile]);

  const handleCopy = (keyName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast({ title: "কপি হয়েছে!", description: text });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত নতুন API Key জেনারেট করতে চান? পূর্বের Key অকার্যকর হয়ে যাবে।")) return;
    setRegenerating(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const keys = await ResellerService.generateNewApiKey(uid);
      setProfile((prev) => prev ? { ...prev, ...keys } : null);
      toast({ title: "নতুন API Key তৈরি হয়েছে!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: e.message });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      await ResellerService.updateWebhook(uid, webhookUrl);
      toast({ title: "Webhook URL সেভ হয়েছে!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: e.message });
    } finally {
      setSavingWebhook(false);
    }
  };

  // Run Live API Call
  const handleExecuteApiTest = async () => {
    setTestingApi(true);
    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          "x-reseller-key": profile?.apiKey || "dt_live_res_demo_key",
        }
      };

      if (requestMethod === "POST") {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint, options);
      const data = await res.json();
      const endTime = performance.now();

      setApiStatus(res.status);
      setApiResponse(data);
      setApiLatency(Math.round(endTime - startTime));
      toast({ title: `API Response: ${res.status} OK`, description: `${Math.round(endTime - startTime)}ms` });
    } catch (err: any) {
      setApiStatus(500);
      setApiResponse({ error: err.message });
      setApiLatency(Math.round(performance.now() - startTime));
    } finally {
      setTestingApi(false);
    }
  };

  const handleEndpointSelect = (ep: string, method: "GET" | "POST") => {
    setSelectedEndpoint(ep);
    setRequestMethod(method);
    if (ep === "/api/reseller/products") {
      setRequestBody("");
    } else if (ep === "/api/reseller/orders/create") {
      setRequestBody(
`{
  "product_id": "297705",
  "quantity": 1,
  "customer_selling_price": 1250,
  "delivery_area": "inside_dhaka",
  "customer_name": "আব্দুল করিম",
  "customer_phone": "01712345678",
  "customer_address": "হাউজ #৪, রোড #১০, ধানমন্ডি, ঢাকা",
  "customer_city": "Dhaka",
  "reseller_shop_name": "${profile?.shopName || "Smart Bazar BD"}",
  "notes": "জরুরি পার্সেল"
}`
      );
    }
  };

  // Code Samples
  const wooCommerceSample = `<?php
/**
 * Durtup Reseller API Integration for WooCommerce
 * Automatically forwards customer orders to Durtup for automated fulfillment
 */
add_action('woocommerce_thankyou', 'durtup_auto_forward_dropship_order', 10, 1);

function durtup_auto_forward_dropship_order($order_id) {
    if (!$order_id) return;
    $order = wc_get_order($order_id);

    $api_key = "${profile?.apiKey || "YOUR_DURTUP_API_KEY"}";
    $api_url = "${baseUrl}/api/reseller/orders/create";

    $items = $order->get_items();
    foreach ($items as $item) {
        $product = $item->get_product();
        $sku = $product->get_sku() ?: $product->get_id();

        $payload = [
            'product_id' => $sku,
            'quantity' => $item->get_quantity(),
            'customer_selling_price' => $item->get_total() / $item->get_quantity(),
            'delivery_area' => $order->get_billing_city() === 'Dhaka' ? 'inside_dhaka' : 'outside_dhaka',
            'customer_name' => $order->get_formatted_billing_full_name(),
            'customer_phone' => $order->get_billing_phone(),
            'customer_address' => $order->get_billing_address_1() . ', ' . $order->get_billing_city(),
            'customer_city' => $order->get_billing_city(),
            'reseller_shop_name' => get_bloginfo('name'),
        ];

        wp_remote_post($api_url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'x-reseller-key' => $api_key,
            ],
            'body' => json_encode($payload),
            'timeout' => 15
        ]);
    }
}`;

  const jsSample = `// Node.js / Browser Axios or Fetch Example
import axios from 'axios';

const API_KEY = '${profile?.apiKey || "YOUR_API_KEY"}';
const BASE_URL = '${baseUrl}/api/reseller';

// 1. Fetch Wholesale Catalog
async function getCatalog() {
  const { data } = await axios.get(\`\${BASE_URL}/products\`, {
    headers: { 'x-reseller-key': API_KEY }
  });
  console.log('Wholesale Products:', data.data);
}

// 2. Place Customer Order Programmatically
async function createOrder(customerOrder) {
  const { data } = await axios.post(\`\${BASE_URL}/orders/create\`, customerOrder, {
    headers: { 
      'Content-Type': 'application/json',
      'x-reseller-key': API_KEY 
    }
  });
  console.log('Order Placed! Tracking:', data.data.tracking_code);
}`;

  const pythonSample = `import requests

API_KEY = "${profile?.apiKey || "YOUR_API_KEY"}"
BASE_URL = "${baseUrl}/api/reseller"

headers = {
    "Content-Type": "application/json",
    "x-reseller-key": API_KEY
}

# 1. Get Products
response = requests.get(f"{BASE_URL}/products", headers=headers)
print("Products:", response.json())

# 2. Place Order
order_payload = {
    "product_id": "297705",
    "quantity": 1,
    "customer_selling_price": 1250,
    "delivery_area": "inside_dhaka",
    "customer_name": "কাস্টমার নাম",
    "customer_phone": "01700000000",
    "customer_address": "বাড়ি #৪, রোড #১০, ঢাকা",
    "customer_city": "Dhaka",
    "reseller_shop_name": "${profile?.shopName || "My Shop"}"
}

order_res = requests.post(f"{BASE_URL}/orders/create", json=order_payload, headers=headers)
print("Order Response:", order_res.json())`;

  const curlSample = `curl -X POST "${baseUrl}/api/reseller/orders/create" \\
  -H "Content-Type: application/json" \\
  -H "x-reseller-key: ${profile?.apiKey || "YOUR_API_KEY"}" \\
  -d '{
    "product_id": "297705",
    "quantity": 1,
    "customer_selling_price": 1250,
    "delivery_area": "inside_dhaka",
    "customer_name": "Abdul Karim",
    "customer_phone": "01712345678",
    "customer_address": "House 12, Road 4, Uttara, Dhaka",
    "customer_city": "Dhaka",
    "reseller_shop_name": "${profile?.shopName || "My Shop"}"
  }'`;

  return (
    <ResellerLayout>
      <SEOHead title="রিসেলার API ইন্টিগ্রেশন ও অটোমেশন - Durtup Reseller" />

      <div className="space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-600" />
              <span>রিসেলার REST API ও অটোমেশন হাব</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার নিজস্ব ওয়েবসাইট, WooCommerce, Shopify বা মোবাইল অ্যাপে API ইন্টিগ্রেশন করে স্বয়ংক্রিয়ভাবে প্রোডাক্ট সেল করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs px-3 py-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block"></span>
              API Status: Online (v1.0)
            </Badge>
          </div>
        </div>

        {/* 1. API Credentials Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-5 border border-slate-700">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-orange-600/30 text-orange-400 flex items-center justify-center">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">আপনার রিসেলার API ক্রেডেনশিয়াল</h3>
                <p className="text-xs text-slate-400">এই Key দিয়ে যেকোনো অ্যাপ বা ওয়েবসাইট থেকে স্বয়ংক্রিয়ভাবে অর্ডার পাঠান</p>
              </div>
            </div>

            <Button
              onClick={handleRegenerateKey}
              disabled={regenerating}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
              <span>নতুন Key জেনারেট করুন</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Live API Key */}
            <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">Live API Key (Public / Header)</span>
                <span className="text-orange-400 font-bold">x-reseller-key</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-orange-400 truncate flex-1">
                  {profile?.apiKey || "dt_live_res_..."}
                </code>
                <Button
                  onClick={() => handleCopy("apiKey", profile?.apiKey || "")}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs text-white hover:bg-white/10 rounded-lg shrink-0"
                >
                  {copiedKey === "apiKey" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">API Secret</span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showSecret ? "Hide" : "Show"}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-slate-300 truncate flex-1">
                  {showSecret ? (profile?.apiSecret || "dts_...") : "••••••••••••••••••••••••"}
                </code>
                <Button
                  onClick={() => handleCopy("apiSecret", profile?.apiSecret || "")}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs text-white hover:bg-white/10 rounded-lg shrink-0"
                >
                  {copiedKey === "apiSecret" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

          </div>

          {/* Base Endpoint URL */}
          <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-400 shrink-0" />
              <span className="text-slate-400">API Base URL:</span>
              <code className="font-mono text-emerald-400 font-bold">{baseUrl}/api/reseller</code>
            </div>
            <Button
              onClick={() => handleCopy("baseUrl", `${baseUrl}/api/reseller`)}
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs font-bold rounded-xl h-8 px-3"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span>URL কপি করুন</span>
            </Button>
          </div>

        </div>

        {/* 2. Live Interactive API Console & Tester */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-orange-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                লাইভ API কনসোল ও রিকোয়েস্ট টেস্ট করুন
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">ব্রাউজার থেকেই সরাসরি লাইভ কল টেস্ট করুন</span>
          </div>

          {/* Endpoint quick picker */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => handleEndpointSelect("/api/reseller/products", "GET")}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                selectedEndpoint === "/api/reseller/products"
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Badge className="bg-blue-600 text-[9px] px-1 py-0 text-white">GET</Badge>
              <span>হোলসেল প্রোডাক্টস (/products)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/orders/create", "POST")}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                selectedEndpoint === "/api/reseller/orders/create"
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Badge className="bg-emerald-600 text-[9px] px-1 py-0 text-white">POST</Badge>
              <span>স্বয়ংক্রিয় অর্ডার তৈরি (/orders/create)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/orders", "GET")}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                selectedEndpoint === "/api/reseller/orders"
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Badge className="bg-blue-600 text-[9px] px-1 py-0 text-white">GET</Badge>
              <span>অর্ডার হিস্ট্রি ও ট্র্যাকিং (/orders)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/wallet", "GET")}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                selectedEndpoint === "/api/reseller/wallet"
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Badge className="bg-blue-600 text-[9px] px-1 py-0 text-white">GET</Badge>
              <span>ওয়ালেট ব্যালেন্স (/wallet)</span>
            </button>
          </div>

          {/* URL & Send Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex-1 font-mono text-xs">
              <span className="font-extrabold text-orange-600 mr-2">{requestMethod}</span>
              <span className="text-slate-900 dark:text-white font-bold">{selectedEndpoint}</span>
            </div>
            <Button
              onClick={handleExecuteApiTest}
              disabled={testingApi}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-10 px-6 shadow-md shadow-orange-600/20 text-xs"
            >
              {testingApi ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>কলিং হচ্ছে...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>টেস্ট রিকোয়েস্ট পাঠান</span>
                </span>
              )}
            </Button>
          </div>

          {/* Request & Response Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Request Body (if POST) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Request Payload (JSON Body):</span>
                {requestMethod === "GET" && <span className="text-[10px] text-slate-400">GET মেথডে বডি দরকার নেই</span>}
              </div>
              <textarea
                disabled={requestMethod === "GET"}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 text-emerald-400 font-mono text-[11px] p-3.5 rounded-2xl border border-slate-800 focus:outline-hidden disabled:opacity-50"
              />
            </div>

            {/* Live API Response Output */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Response Output:</span>
                {apiStatus && (
                  <div className="flex items-center gap-2">
                    <Badge className={apiStatus < 300 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}>
                      Status: {apiStatus}
                    </Badge>
                    {apiLatency && <span className="text-[10px] text-slate-400 font-mono">{apiLatency}ms</span>}
                  </div>
                )}
              </div>
              <div className="w-full h-52 lg:h-[220px] bg-slate-950 text-slate-200 font-mono text-[11px] p-3.5 rounded-2xl border border-slate-800 overflow-y-auto">
                {apiResponse ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                ) : (
                  <span className="text-slate-600 flex items-center justify-center h-full">
                    উপরের "টেস্ট রিকোয়েস্ট পাঠান" বাটনে ক্লিক করলে এখানে লাইভ রেসপন্স আসবে।
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* 3. Ready-Made Integration Code Snippets (WooCommerce, Node.js, Python, cURL) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              ইন্টিগ্রেশন কোড স্নিপেট ও গাইড (Ready Code Snippets)
            </h2>
          </div>

          <Tabs defaultValue="woocommerce" className="space-y-4">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger value="woocommerce" className="rounded-lg text-xs font-bold">WooCommerce / WordPress</TabsTrigger>
              <TabsTrigger value="nodejs" className="rounded-lg text-xs font-bold">Node.js / JavaScript</TabsTrigger>
              <TabsTrigger value="python" className="rounded-lg text-xs font-bold">Python</TabsTrigger>
              <TabsTrigger value="curl" className="rounded-lg text-xs font-bold">cURL Command</TabsTrigger>
            </TabsList>

            {/* WooCommerce */}
            <TabsContent value="woocommerce" className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                আপনার ওয়ার্ডপ্রেস সাইটের <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-orange-600">functions.php</code> ফাইলে এই কোডটি পেস্ট করলেই যে কোনো কাস্টমার অর্ডার সরাসরি Durtup Reseller API-তে ড্রপশিপ হিসেবে প্লেস হয়ে যাবে:
              </p>
              <div className="relative">
                <Button
                  onClick={() => handleCopy("woo", wooCommerceSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
                >
                  {copiedKey === "woo" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  <span>কপি করুন</span>
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {wooCommerceSample}
                </pre>
              </div>
            </TabsContent>

            {/* Node.js */}
            <TabsContent value="nodejs" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("node", jsSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
                >
                  {copiedKey === "node" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  <span>কপি করুন</span>
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {jsSample}
                </pre>
              </div>
            </TabsContent>

            {/* Python */}
            <TabsContent value="python" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("python", pythonSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
                >
                  {copiedKey === "python" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  <span>কপি করুন</span>
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {pythonSample}
                </pre>
              </div>
            </TabsContent>

            {/* cURL */}
            <TabsContent value="curl" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("curl", curlSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
                >
                  {copiedKey === "curl" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  <span>কপি করুন</span>
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {curlSample}
                </pre>
              </div>
            </TabsContent>

          </Tabs>
        </div>

        {/* 4. Webhook Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              অটোমেশন ওয়েবহুক (Webhook Callbacks)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            অর্ডারের কুরিয়ার স্ট্যাটাস পরিবর্তন হলে (যেমন: Shipped, Delivered, Returned) আমরা স্বয়ংক্রিয়ভাবে আপনার সার্ভারে POST নোটিফিকেশন পাঠাব।
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="url"
              placeholder="https://your-website.com/api/durtup-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="rounded-xl text-xs h-10 flex-1 font-mono"
            />
            <Button
              onClick={handleSaveWebhook}
              disabled={savingWebhook}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-5 text-xs shadow-xs"
            >
              {savingWebhook ? "সেভ হচ্ছে..." : "Webhook সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>

      </div>
    </ResellerLayout>
  );
}
