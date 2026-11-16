import type { Doc } from "./store";

export interface Product extends Doc {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  highlights: string[];
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  specifications?: Record<string, string>;
  featured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  dealPrice?: number;
  dealEndsAt?: string;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
}

export interface Review extends Doc {
  productId: string;
  author: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  verified?: boolean;
  orderId?: string;
}

export interface Coupon extends Doc {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrder?: number;
  maximumDiscount?: number;
  expiry?: string;
  usageLimit?: number;
  usageCount?: number;
  active: boolean;
}

export interface Address {
  fullName: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

export interface SavedAddress extends Doc, Address {}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  color?: string | null;
  size?: string | null;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const ORDER_TIMELINE: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export interface Order extends Doc {
  orderNumber?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string | null;
  total: number;
  address: Address;
  delivery?: "standard" | "express";
  paymentMethod: "cod" | "online";
  paymentStatus?: "pending" | "paid" | "refunded";
  status: OrderStatus;
  placedAt: string;
}

export interface WishlistItem extends Doc {
  productId: string;
}

export interface CartDoc extends Doc {
  productId: string;
  qty: number;
  color?: string | null;
  size?: string | null;
}

export const CATEGORIES = ["Fashion", "Shoes", "Electronics", "Beauty", "Home", "Sports", "Travel","Gaming","Health","Fitness","Accessories"] as const;

export const CATEGORY_BLURB: Record<string, string> = {
  Fashion: "Considered pieces built to last seasons, not scroll cycles.",
  Shoes: "Engineered comfort with a silhouette that doesn't quit.",
 // Watches: "Precision movements wrapped in modern restraint.",
  Electronics: "Tools that disappear into your day and elevate it.",
  Beauty: "Formulas that respect your skin and your shelf.",
  Home: "Objects worth building a room around.",
  Sports: "Gear that keeps pace with where you're going.",
  Travel: "Carry-everything, built for the long haul.",
  Gaming: "Immersive experiences that put you in the game.",
  Health: "Wellness essentials for a balanced lifestyle.",
  Fitness: "Equipment and apparel to keep you moving and motivated.",
  Accessories: "Finishing touches that elevate your look and lifestyle.",
};
