import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CartItemData {
  id: string | number;
  product_id?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant_name?: string;
}

interface SigmaCartCardProps {
  items: CartItemData[];
  subtotal: number;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onProceedCheckout?: () => void;
}

export const SigmaCartCard: React.FC<SigmaCartCardProps> = ({
  items,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-center text-slate-500 my-2 shadow-sm">
        <ShoppingBag className="h-8 w-8 mx-auto text-slate-400 mb-2 opacity-60" />
        <p className="text-xs font-semibold text-slate-700">আপনার কার্ট বর্তমানে খালি আছে</p>
        <p className="text-[11px] text-slate-500 mt-1">পছন্দের যেকোনো প্রোডাক্টে 'Add to Cart' চাপলেই এখানে যুক্ত হবে।</p>
      </div>
    );
  }

  const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-slate-900 shadow-sm my-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              আপনার শপিং কার্ট ({itemCount}টি আইটেম)
            </h4>
            <p className="text-[10px] text-slate-500">লাইভ সিঙ্ক কার্ট স্টেট</p>
          </div>
        </div>
        <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
          Live Cart
        </Badge>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const itemId = String(item.id || item.product_id || idx);
          return (
            <div
              key={itemId}
              className="flex items-center justify-between gap-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl"
            >
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="h-11 w-11 object-cover rounded-lg shrink-0 border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{item.name}</h5>
                {item.variant_name && (
                  <span className="text-[10px] text-slate-500 block">{item.variant_name}</span>
                )}
                <div className="text-xs font-black text-orange-600 mt-0.5">
                  ৳{Number(item.price || 0).toLocaleString()}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity?.(itemId, Math.max(1, (item.quantity || 1) - 1))}
                  className="h-6 w-6 flex items-center justify-center rounded text-slate-600 hover:text-orange-600 hover:bg-slate-100 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-1">{item.quantity || 1}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity?.(itemId, (item.quantity || 1) + 1)}
                  className="h-6 w-6 flex items-center justify-center rounded text-slate-600 hover:text-orange-600 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemoveItem?.(itemId)}
                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Subtotal & Checkout */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 block font-medium">সাবটোটাল</span>
          <span className="text-base font-black text-slate-900">৳{Number(subtotal || 0).toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/cart">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-2xs"
            >
              কার্ট পেজ
            </Button>
          </Link>
          <Link to="/checkout">
            <Button
              size="sm"
              onClick={onProceedCheckout}
              className="h-8 text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white gap-1 rounded-xl shadow-sm shadow-orange-500/20"
            >
              <span>চেকআউট</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
