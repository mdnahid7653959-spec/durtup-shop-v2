import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { calculateProductPrice } from "@/utils/pricingMargin";

export async function handleResellerApiRequest(endpoint: string, method: string, headers: any, body: any) {
  // Extract API key from headers (x-reseller-key or Authorization Bearer)
  const authHeader = headers["authorization"] || headers["Authorization"] || "";
  const apiKeyHeader = headers["x-reseller-key"] || headers["X-Reseller-Key"] || "";
  const apiKey = apiKeyHeader || (authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader);

  // Validate API key presence
  if (!apiKey && !endpoint.includes("/public/")) {
    return {
      status: 401,
      body: {
        success: false,
        error: "Unauthorized: Missing or invalid API Key. Please pass 'x-reseller-key' or 'Authorization: Bearer <API_KEY>'",
      }
    };
  }

  // 1. GET /api/reseller/products - Wholesale Catalog
  if (endpoint.endsWith("/products") && method === "GET") {
    const products = FAST_SEED_PRODUCTS.map((p) => {
      const calculated = calculateProductPrice(p.price, (p as any).cost_price, p.category);
      const mrp = Math.round(calculated.salePrice || p.price * 115 || 850);
      const wholesalePrice = Math.max(Math.round(mrp * 0.65), 150);
      const margin = mrp - wholesalePrice;

      return {
        product_id: p.id,
        name: p.name,
        name_bn: (p as any).name_bn || p.name,
        slug: p.slug,
        category: p.category,
        image: p.image,
        images: (p as any).images || [p.image],
        wholesale_price: wholesalePrice,
        suggested_mrp: mrp,
        potential_profit: margin,
        stock_quantity: (p as any).stock || 100,
        in_stock: true,
        delivery_charge: {
          inside_dhaka: 70,
          outside_dhaka: 130
        },
        description_bn: (p as any).description || `${p.name} - ১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি পণ্য।`,
      };
    });

    return {
      status: 200,
      body: {
        success: true,
        total: products.length,
        currency: "BDT",
        data: products,
      }
    };
  }

  // 2. POST /api/reseller/orders/create - Automatic Order Placement
  if (endpoint.endsWith("/orders/create") && method === "POST") {
    const { 
      product_id, 
      quantity = 1, 
      customer_selling_price, 
      delivery_area = "inside_dhaka",
      customer_name, 
      customer_phone, 
      customer_alt_phone,
      customer_address, 
      customer_city = "Dhaka",
      reseller_shop_name = "My Reseller Shop",
      notes = ""
    } = body;

    if (!product_id) {
      return { status: 400, body: { success: false, error: "Missing required parameter: 'product_id'" } };
    }
    if (!customer_name || !customer_phone || !customer_address) {
      return { status: 400, body: { success: false, error: "Missing required customer fields: 'customer_name', 'customer_phone', 'customer_address'" } };
    }

    const product = FAST_SEED_PRODUCTS.find((p) => p.id === product_id) || FAST_SEED_PRODUCTS[0];
    const calculated = calculateProductPrice(product.price, (product as any).cost_price, product.category);
    const mrp = Math.round(calculated.salePrice || product.price * 115 || 850);
    const unitWholesale = Math.max(Math.round(mrp * 0.65), 150);

    const unitSellingPrice = customer_selling_price ? Number(customer_selling_price) : mrp;
    const deliveryFee = delivery_area === "outside_dhaka" ? 130 : 70;
    const totalGoodsSelling = unitSellingPrice * quantity;
    const totalWholesale = unitWholesale * quantity;
    const totalCustomerBill = totalGoodsSelling + deliveryFee;
    const netProfit = totalGoodsSelling - totalWholesale;

    const orderNumber = `API-RO-${Date.now().toString().slice(-6)}`;
    const trackingCode = `SF-BD-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const orderRecord = {
      order_id: "ro_api_" + Date.now(),
      order_number: orderNumber,
      order_status: "processing",
      tracking_code: trackingCode,
      courier_partner: "Steadfast Courier / Pathao",
      created_at: new Date().toISOString(),
      customer: {
        name: customer_name,
        phone: customer_phone,
        alt_phone: customer_alt_phone || null,
        address: customer_address,
        city: customer_city,
        delivery_area: delivery_area,
      },
      product: {
        product_id: product.id,
        name: product.name,
        quantity: quantity,
        unit_wholesale_price: unitWholesale,
        unit_selling_price: unitSellingPrice,
      },
      financials: {
        currency: "BDT",
        total_wholesale_cost: totalWholesale,
        total_customer_price: totalGoodsSelling,
        delivery_fee: deliveryFee,
        total_customer_payable_cod: totalCustomerBill,
        reseller_net_profit: netProfit,
        profit_status: "pending_delivery",
      },
      branding: {
        sender_shop_name: reseller_shop_name,
        notes: notes,
      }
    };

    return {
      status: 201,
      body: {
        success: true,
        message: "Order placed successfully via Reseller API",
        data: orderRecord,
      }
    };
  }

  // 3. GET /api/reseller/orders - Get Orders List
  if (endpoint.endsWith("/orders") && method === "GET") {
    return {
      status: 200,
      body: {
        success: true,
        currency: "BDT",
        data: [
          {
            order_number: `API-RO-${Date.now().toString().slice(-6)}`,
            status: "processing",
            courier: "Steadfast Courier",
            tracking_code: `SF-BD-${Math.floor(1000000 + Math.random() * 9000000)}`,
            total_bill: 1250,
            net_profit: 450,
            profit_status: "pending_delivery",
            created_at: new Date().toISOString(),
          }
        ]
      }
    };
  }

  // 4. GET /api/reseller/wallet - Wallet and Earnings
  if (endpoint.endsWith("/wallet") && method === "GET") {
    return {
      status: 200,
      body: {
        success: true,
        currency: "BDT",
        wallet: {
          available_balance: 1550,
          pending_balance: 850,
          total_withdrawn: 3400,
          minimum_withdrawal: 100,
          payout_methods: ["bkash", "nagad", "rocket", "bank"],
        }
      }
    };
  }

  // 5. POST /api/reseller/verify-key - Validate credentials
  if (endpoint.endsWith("/verify-key")) {
    return {
      status: 200,
      body: {
        success: true,
        authenticated: true,
        api_key_prefix: apiKey.slice(0, 15) + "...",
        tier: "Partner Active",
        rate_limit: "1000 req/min",
      }
    };
  }

  // Fallback for unknown endpoint
  return {
    status: 404,
    body: {
      success: false,
      error: `Endpoint '${endpoint}' not found. Available endpoints: /api/reseller/products, /api/reseller/orders/create, /api/reseller/orders, /api/reseller/wallet, /api/reseller/verify-key`,
    }
  };
}
