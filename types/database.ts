export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          handle: string | null;
          avatar_url: string | null;
          role: "user" | "creator" | "founder" | "moderator" | "admin";
          trust_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          handle?: string | null;
          avatar_url?: string | null;
          role?: "user" | "creator" | "founder" | "moderator" | "admin";
          trust_score?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string;
          description: string;
          logo_url: string | null;
          website_url: string;
          affiliate_url: string | null;
          pricing_model: string;
          starting_price: number;
          verified: boolean;
          status: "draft" | "published" | "archived";
          founder_id: string | null;
          rating_avg: number;
          review_count: number;
          trust_score: number;
          trending_score: number;
          launched_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          tagline: string;
          description: string;
          website_url: string;
          logo_url?: string | null;
          affiliate_url?: string | null;
          pricing_model?: string;
          starting_price?: number;
          verified?: boolean;
          status?: "draft" | "published" | "archived";
          founder_id?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["tools"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan_id: string;
          status: string;
          cancel_at_period_end: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan_id: string;
          status: string;
          cancel_at_period_end?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          stripe_invoice_id: string | null;
          stripe_customer_id: string | null;
          amount_due: number;
          amount_paid: number;
          currency: string;
          status: string | null;
          hosted_invoice_url: string | null;
          invoice_pdf: string | null;
          created_at: string;
        };
        Insert: {
          stripe_invoice_id?: string | null;
          stripe_customer_id?: string | null;
          amount_due: number;
          amount_paid: number;
          currency: string;
          status?: string | null;
          hosted_invoice_url?: string | null;
          invoice_pdf?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
