/**
 * useFrappeList Hook
 *
 * React hook for fetching a list of Frappe documents with filtering and pagination
 */

"use client";

import { useState, useEffect } from "react";
import { FrappeDoc } from "@/types/frappe";

interface UseFrappeListOptions {
  doctype: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
  start?: number;
}

interface UseFrappeListResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  total: number;
  mutate: () => Promise<void>;
}

export function useFrappeList<T extends FrappeDoc>({
  doctype,
  fields = ["*"],
  filters = {},
  orderBy = "modified desc",
  limit = 20,
  start = 0,
}: UseFrappeListOptions): UseFrappeListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // TODO: Implement fetch from Frappe API
    // GET /api/resource/{doctype}?fields={}&filters={}&limit_page_length={}&limit_start={}
    setLoading(false);
  }, [doctype, fields, filters, orderBy, limit, start]);

  const mutate = async () => {
    // TODO: Refetch list
  };

  return {
    data,
    loading,
    error,
    total,
    mutate,
  };
}
