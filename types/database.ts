export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: string;
          influencer_id: string;
          name: string;
          notes: string | null;
          start_date: string | null;
          total_value: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          influencer_id: string;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          total_value?: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          influencer_id?: string;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          total_value?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_influencer_id_fkey";
            columns: ["influencer_id"];
            isOneToOne: false;
            referencedRelation: "influencers";
            referencedColumns: ["id"];
          }
        ];
      };
      deliverables: {
        Row: {
          campaign_id: string;
          created_at: string;
          due_date: string | null;
          id: string;
          is_posted: boolean;
          live_url: string | null;
          posted_at: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          is_posted?: boolean;
          live_url?: string | null;
          posted_at?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          is_posted?: boolean;
          live_url?: string | null;
          posted_at?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deliverables_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      influencers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          platform: string;
          profile_url: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          platform: string;
          profile_url?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          platform?: string;
          profile_url?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          campaign_id: string;
          created_at: string;
          id: string;
          note: string | null;
          payment_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          campaign_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          payment_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          campaign_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          payment_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
