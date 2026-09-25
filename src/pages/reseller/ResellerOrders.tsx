import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  PackageCheck, 
  Search, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  ExternalLink, 
  PlusCircle, 
  ChevronRight, 
  Phone, 
  MapPin, 
  Store,
  Filter,
  Eye
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerOrder } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResellerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ResellerOrder | null>(null);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getOrders(uid)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "ট্র্যাকিং কোড কপি হয়েছে!", description: code });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">ডেলিভারি সম্পন্ন</Badge>;
      case "shipped":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">কুরিয়ারে পথে আছে</Badge>;
      case "processing":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">প্যাকেজিং হচ্ছে</Badge>;
      case "returned":
        return <Badge className="bg-rose-600 text-white hover:bg-rose-700">রিটার্ন</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-slate-500 border-slate-300">বাতিল</Badge>;
      default:
        return <Badge className="bg-orange-600 text-white">{status}</Badge>;
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="কাস্টমার অর্ডারসমূহ - Durtup Reseller" />

      <div className="space-y-6">
        
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="h-6 w-6 text-orange-600" />
              <span>আমার কাস্টমার অর্ডারসমূহ</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার সাবমিট করা কাস্টমার পার্সেল ও ডেলিভারি ট্র্যাকিং স্ট্যাটাস লাইভ দেখুন।
            </p>
          </div>

          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs">
            <Link to="/reseller/orders/new" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>নতুন কাস্টমার অর্ডার দিন</span>
            </Link>
          </Button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="অর্ডার আইডি, কাস্টমার নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            {[
              { id: "all", label: `সকল অর্ডার (${orders.length})` },
              { id: "processing", label: "প্যাকেজিং হচ্ছে" },
              { id: "shipped", label: "কুরিয়ারে পথে আছে" },
              { id: "delivered", label: "ডেলিভারি সম্পন্ন" },
              { id: "returned", label: "রিটার্ন" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Orders Table or List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Truck className="h-12 w-12 mx-auto text-slate-400" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              কোনো কাস্টমার অর্ডার পাওয়া যায়নি
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ফেসবুক পেজ বা সোশ্যাল মিডিয়া থেকে কাস্টমার অর্ডার নিয়ে সাবমিট করুন।
            </p>
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl mt-2">
              <Link to="/reseller/orders/new">নতুন অর্ডার করুন</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4 font-bold">অর্ডার আইডি ও তারিখ</th>
                    <th className="p-4 font-bold">কাস্টমার তথ্য</th>
                    <th className="p-4 font-bold">পণ্য ও পরিমাণ</th>
                    <th className="p-4 font-bold">কাস্টমার বিল (COD)</th>
                    <th className="p-4 font-bold">আপনার প্রফিট</th>
                    <th className="p-4 font-bold">স্ট্যাটাস ও ট্র্যাকিং</th>
                    <th className="p-4 font-bold text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Order ID & Date */}
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{order.orderNumber}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{order.customerPhone}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{order.customerCity}</span>
                        </p>
                      </td>

                      {/* Product */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="h-10 w-10 rounded-lg object-cover border shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[150px]">
                              {order.productName}
                            </p>
                            <span className="text-[10px] text-slate-500">পরিমাণ: {order.quantity} টি</span>
                          </div>
                        </div>
                      </td>

                      {/* Total Customer Bill */}
                      <td className="p-4">
                        <p className="font-black text-slate-900 dark:text-white text-sm">৳{order.totalCustomerBill}</p>
                        <span className="text-[10px] text-slate-500">ডেলিভারি সহ</span>
                      </td>

                      {/* Profit Margin */}
                      <td className="p-4">
                        <p className="font-black text-emerald-600 text-sm">+৳{order.netProfit}</p>
                        <Badge variant="outline" className={`text-[9px] mt-0.5 px-1.5 py-0 ${
                          order.profitStatus === "available" ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-amber-500 text-amber-600 bg-amber-50"
                        }`}>
                          {order.profitStatus === "available" ? "ওয়ালেটে যোগ হয়েছে" : "পেন্ডিং (ডেলিভারি পর)"}
                        </Badge>
                      </td>

                      {/* Courier Tracking & Status */}
                      <td className="p-4">
                        <div>
                          {getStatusBadge(order.orderStatus)}
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="font-mono">{order.trackingCode}</span>
                            <button
                              onClick={() => copyTracking(order.trackingCode)}
                              className="text-slate-400 hover:text-slate-600"
                              title="কপি ট্র্যাকিং"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Action View */}
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs h-8 px-2.5"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>রিসিপ্ট</span>
                        </Button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Order Invoice / Receipt Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center justify-between">
              <span>অর্ডার ইনভয়েস ও মেমো</span>
              {selectedOrder && (
                <Badge className="bg-orange-600 text-white">{selectedOrder.orderNumber}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-xs">
              
              {/* Reseller Branding Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">প্রেরক (আপনার শপ):</span>
                  <p className="font-black text-sm text-slate-900 dark:text-white">{selectedOrder.resellerShopName}</p>
                  {selectedOrder.resellerPhone && <p className="text-slate-500">{selectedOrder.resellerPhone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">কুরিয়ার:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.courierName}</p>
                  <p className="font-mono text-[10px] text-orange-600">{selectedOrder.trackingCode}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 border rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">প্রাপক / কাস্টমার:</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</p>
                <p className="text-slate-600 dark:text-slate-300">ফোন: {selectedOrder.customerPhone} {selectedOrder.customerAltPhone ? `| ${selectedOrder.customerAltPhone}` : ""}</p>
                <p className="text-slate-600 dark:text-slate-300">ঠিকানা: {selectedOrder.customerAddress}, {selectedOrder.customerCity}</p>
              </div>

              {/* Product details */}
              <div className="p-3 border rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <img src={selectedOrder.productImage} alt={selectedOrder.productName} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.productName}</p>
                    <p className="text-slate-500">পরিমাণ: {selectedOrder.quantity} টি</p>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>কাস্টমার সেলিং প্রাইস:</span>
                    <span>৳{selectedOrder.customerSellingPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>৳{selectedOrder.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-1 border-t">
                    <span>মোট কাস্টমার বিল (COD):</span>
                    <span className="text-orange-600">৳{selectedOrder.totalCustomerBill}</span>
                  </div>
                </div>
              </div>

              {/* Profit banner */}
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">আপনার নিশ্চিত প্রফিট:</span>
                  <span className="text-xl font-black text-emerald-600">+৳{selectedOrder.netProfit}</span>
                </div>
                <Badge className={selectedOrder.profitStatus === "available" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                  {selectedOrder.profitStatus === "available" ? "ওয়ালেটে প্রাপ্ত" : "ডেলিভারি পেন্ডিং"}
                </Badge>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </ResellerLayout>
  );
}
