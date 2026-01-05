/**
 * useLinkedFieldResolver Hook
 *
 * Resolves fields from linked DocTypes by fetching the related documents
 * and merging the data into the main documents.
 */

"use client";

import { useState, useEffect, useMemo } from "react";

interface LinkedFieldConfig {
  /** The column fieldname with dot notation (e.g., "director.full_name") */
  fieldname: string;
  /** The link field in the main document (e.g., "director") */
  linkField: string;
  /** The field to fetch from the linked document (e.g., "full_name") */
  linkedField: string;
  /** The linked DocType name (e.g., "User") */
  linkedDoctype: string;
}

interface UseLinkedFieldResolverOptions {
  /** The main documents to resolve */
  documents: Record<string, unknown>[] | undefined;
  /** Visible columns configuration */
  visibleColumns: Array<{ fieldname: string; label?: string }>;
  /** Map of link field name to DocType name */
  linkFieldMap: Map<string, string>;
  /** Whether to enable the resolver */
  enabled?: boolean;
}

interface UseLinkedFieldResolverResult {
  /** Documents with linked fields resolved */
  resolvedDocuments: Record<string, unknown>[];
  /** Whether linked data is being fetched */
  isResolving: boolean;
}

/**
 * Parse a dot-notation fieldname into its components
 */
function parseLinkedField(
  fieldname: string,
  linkFieldMap: Map<string, string>
): LinkedFieldConfig | null {
  if (!fieldname.includes(".")) return null;

  const parts = fieldname.split(".");
  if (parts.length !== 2) return null;

  const [linkField, linkedField] = parts;
  const linkedDoctype = linkFieldMap.get(linkField);

  if (!linkedDoctype) return null;

  return {
    fieldname,
    linkField,
    linkedField,
    linkedDoctype,
  };
}

export function useLinkedFieldResolver({
  documents,
  visibleColumns,
  linkFieldMap,
  enabled = true,
}: UseLinkedFieldResolverOptions): UseLinkedFieldResolverResult {
  const [linkedData, setLinkedData] = useState<Map<string, Map<string, Record<string, unknown>>>>(
    new Map()
  );
  const [isResolving, setIsResolving] = useState(false);

  // Parse linked field configs from visible columns
  const linkedFieldConfigs = useMemo(() => {
    const configs: LinkedFieldConfig[] = [];
    visibleColumns.forEach((col) => {
      const config = parseLinkedField(col.fieldname, linkFieldMap);
      if (config) {
        configs.push(config);
      }
    });
    return configs;
  }, [visibleColumns, linkFieldMap]);

  // Group linked fields by DocType for efficient fetching
  const linkedFieldsByDoctype = useMemo(() => {
    const byDoctype = new Map<string, { linkField: string; fields: Set<string> }>();

    linkedFieldConfigs.forEach((config) => {
      const existing = byDoctype.get(config.linkedDoctype);
      if (existing) {
        existing.fields.add(config.linkedField);
      } else {
        byDoctype.set(config.linkedDoctype, {
          linkField: config.linkField,
          fields: new Set([config.linkedField, "name"]),
        });
      }
    });

    return byDoctype;
  }, [linkedFieldConfigs]);

  // Fetch linked documents when main documents change
  useEffect(() => {
    console.log("[useLinkedFieldResolver] Effect triggered:", {
      enabled,
      documentsLength: documents?.length,
      linkedFieldsByDoctypeSize: linkedFieldsByDoctype.size,
      linkedFieldConfigs: linkedFieldConfigs.map(c => c.fieldname),
      linkFieldMapEntries: Array.from(linkFieldMap.entries()),
    });

    if (!enabled || !documents || documents.length === 0 || linkedFieldsByDoctype.size === 0) {
      console.log("[useLinkedFieldResolver] Skipping - conditions not met");
      return;
    }

    const fetchLinkedDocuments = async () => {
      setIsResolving(true);
      const newLinkedData = new Map<string, Map<string, Record<string, unknown>>>();

      try {
        for (const [doctype, config] of linkedFieldsByDoctype) {
          // Collect unique IDs for this link field
          const ids = new Set<string>();
          documents.forEach((doc) => {
            const linkValue = doc[config.linkField];
            if (linkValue && typeof linkValue === "string") {
              ids.add(linkValue);
            }
          });

          console.log(`[useLinkedFieldResolver] Collected IDs for ${doctype}:`, {
            linkField: config.linkField,
            ids: Array.from(ids),
            sampleDocs: documents.slice(0, 3).map(d => ({ name: d.name, [config.linkField]: d[config.linkField] })),
          });

          if (ids.size === 0) continue;

          // Fetch linked documents
          const fields = Array.from(config.fields);
          const idsArray = Array.from(ids);

          // Build filters to fetch only the documents we need
          const filters = JSON.stringify([["name", "in", idsArray]]);
          const fieldsParam = JSON.stringify(fields);

          const url = `/api/frappe/api/resource/${encodeURIComponent(doctype)}?fields=${encodeURIComponent(fieldsParam)}&filters=${encodeURIComponent(filters)}&limit_page_length=0`;

          const response = await fetch(url, { credentials: "include" });

          if (!response.ok) {
            console.error(`Failed to fetch linked ${doctype} documents`, response.status);
            continue;
          }

          const data = await response.json();
          const linkedDocs = data?.data || [];

          // Build a map of name -> document
          const docMap = new Map<string, Record<string, unknown>>();
          linkedDocs.forEach((doc: Record<string, unknown>) => {
            if (doc.name) {
              docMap.set(doc.name as string, doc);
            }
          });

          newLinkedData.set(config.linkField, docMap);
        }

        setLinkedData(newLinkedData);
      } catch (error) {
        console.error("Error fetching linked documents:", error);
      } finally {
        setIsResolving(false);
      }
    };

    fetchLinkedDocuments();
  }, [documents, linkedFieldsByDoctype, enabled]);

  // Merge linked data into documents
  const resolvedDocuments = useMemo(() => {
    if (!documents) return [];
    if (linkedFieldConfigs.length === 0) return documents as Record<string, unknown>[];

    return documents.map((doc) => {
      const resolved = { ...doc };

      linkedFieldConfigs.forEach((config) => {
        const linkValue = doc[config.linkField];
        if (!linkValue || typeof linkValue !== "string") return;

        const docMap = linkedData.get(config.linkField);
        if (!docMap) return;

        const linkedDoc = docMap.get(linkValue);
        if (!linkedDoc) return;

        // Set the resolved value using the full fieldname
        resolved[config.fieldname] = linkedDoc[config.linkedField];
      });

      return resolved;
    });
  }, [documents, linkedFieldConfigs, linkedData]);

  return {
    resolvedDocuments,
    isResolving,
  };
}
