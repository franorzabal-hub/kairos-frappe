/**
 * useFrappeDoc Hook
 *
 * React hook for fetching and mutating a single Frappe document
 */

"use client";

import { useState, useEffect } from "react";
import { FrappeDoc } from "@/types/frappe";

interface UseFrappeDocOptions {
  doctype: string;
  docname: string;
}

interface UseFrappeDocResult<T> {
  doc: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
  updateDoc: (data: Partial<T>) => Promise<void>;
  deleteDoc: () => Promise<void>;
}

export function useFrappeDoc<T extends FrappeDoc>({
  doctype,
  docname,
}: UseFrappeDocOptions): UseFrappeDocResult<T> {
  const [doc, setDoc] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implement fetch from Frappe API
    // GET /api/resource/{doctype}/{docname}
    setLoading(false);
  }, [doctype, docname]);

  const mutate = async () => {
    // TODO: Refetch document
  };

  const updateDoc = async (data: Partial<T>) => {
    // TODO: PUT /api/resource/{doctype}/{docname}
  };

  const deleteDoc = async () => {
    // TODO: DELETE /api/resource/{doctype}/{docname}
  };

  return {
    doc,
    loading,
    error,
    mutate,
    updateDoc,
    deleteDoc,
  };
}
