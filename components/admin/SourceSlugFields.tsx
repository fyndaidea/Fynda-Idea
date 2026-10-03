"use client";

import { useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/slugify";
import { inputClass, labelClass } from "@/lib/ui-classes";

type AvailabilityResult = { available: boolean; message?: string };

type Props = {
  sourceLabel: string;
  sourceName: string;
  slugName?: string;
  initialSource: string;
  initialSlug: string;
  /** When true (edit mode), changing the source field does not rewrite the slug. */
  lockSlugFromSource?: boolean;
  sourceRequired?: boolean;
  slugPlaceholder?: string;
  /** Optional uniqueness check (e.g. against an admin check-slug API). */
  checkSlugAvailable?: (slug: string) => Promise<AvailabilityResult>;
  /** Optional uniqueness check for the source/name field. */
  checkNameAvailable?: (name: string) => Promise<AvailabilityResult>;
};

export function SourceSlugFields({
  sourceLabel,
  sourceName,
  slugName = "slug",
  initialSource,
  initialSlug,
  lockSlugFromSource = false,
  sourceRequired = true,
  slugPlaceholder,
  checkSlugAvailable,
  checkNameAvailable,
}: Props) {
  const [source, setSource] = useState(initialSource);
  const [slug, setSlug] = useState(initialSlug);
  const [slugManual, setSlugManual] = useState(lockSlugFromSource);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [nameChecking, setNameChecking] = useState(false);
  const slugCheckSeq = useRef(0);
  const nameCheckSeq = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const lastCheckedName = useRef<string | null>(null);
  const lastCheckedSlug = useRef<string | null>(null);

  useEffect(() => {
    setSource(initialSource);
    setSlug(initialSlug);
    setSlugManual(lockSlugFromSource);
    setSlugError(null);
    setNameError(null);
    lastCheckedName.current = null;
    lastCheckedSlug.current = null;
  }, [initialSource, initialSlug, lockSlugFromSource]);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(source));
    }
  }, [source, slugManual]);

  useEffect(() => {
    nameInputRef.current?.setCustomValidity(nameError ?? "");
  }, [nameError]);

  useEffect(() => {
    slugInputRef.current?.setCustomValidity(slugError ?? "");
  }, [slugError]);

  const runNameCheck = async (raw: string) => {
    if (!checkNameAvailable) return;
    const trimmed = raw.trim();
    if (!trimmed) {
      setNameError(null);
      setNameChecking(false);
      lastCheckedName.current = "";
      return;
    }
    if (lastCheckedName.current === trimmed) return;

    const seq = ++nameCheckSeq.current;
    setNameChecking(true);
    try {
      const result = await checkNameAvailable(trimmed);
      if (seq !== nameCheckSeq.current) return;
      lastCheckedName.current = trimmed;
      setNameError(result.available ? null : result.message ?? "Name is already in use.");
    } catch {
      if (seq !== nameCheckSeq.current) return;
      setNameError(null);
    } finally {
      if (seq === nameCheckSeq.current) setNameChecking(false);
    }
  };

  const runSlugCheck = async (raw: string) => {
    if (!checkSlugAvailable) return;
    const normalized = slugify(raw) || raw.trim().toLowerCase();
    if (!normalized) {
      setSlugError(null);
      setSlugChecking(false);
      lastCheckedSlug.current = "";
      return;
    }
    if (lastCheckedSlug.current === normalized) return;

    const seq = ++slugCheckSeq.current;
    setSlugChecking(true);
    try {
      const result = await checkSlugAvailable(normalized);
      if (seq !== slugCheckSeq.current) return;
      lastCheckedSlug.current = normalized;
      setSlugError(result.available ? null : result.message ?? "Slug is already in use.");
    } catch {
      if (seq !== slugCheckSeq.current) return;
      setSlugError(null);
    } finally {
      if (seq === slugCheckSeq.current) setSlugChecking(false);
    }
  };

  return (
    <>
      <div data-tool-field={sourceName}>
        <label className={labelClass} htmlFor={sourceName}>
          {sourceLabel}
        </label>
        <input
          ref={nameInputRef}
          id={sourceName}
          name={sourceName}
          className={[
            inputClass,
            nameError ? "border-red-500/50 focus:border-red-500" : "",
          ].join(" ")}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setNameError(null);
            lastCheckedName.current = null;
            if (!slugManual) {
              setSlugError(null);
              lastCheckedSlug.current = null;
            }
          }}
          onBlur={() => {
            void runNameCheck(source);
            if (!slugManual) {
              void runSlugCheck(slugify(source));
            }
          }}
          required={sourceRequired}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? `${sourceName}-error` : undefined}
        />
        {nameError ? (
          <p id={`${sourceName}-error`} className="mt-1 text-xs text-red-400">
            {nameError}
          </p>
        ) : nameChecking ? (
          <p className="mt-1 text-xs text-[color:var(--muted)]">Checking name…</p>
        ) : null}
      </div>
      <div data-tool-field={slugName}>
        <label className={labelClass} htmlFor={slugName}>
          Slug
        </label>
        <input
          ref={slugInputRef}
          id={slugName}
          name={slugName}
          className={[
            inputClass,
            slugError ? "border-red-500/50 focus:border-red-500" : "",
          ].join(" ")}
          value={slug}
          onChange={(e) => {
            setSlugManual(true);
            setSlug(e.target.value);
            setSlugError(null);
            lastCheckedSlug.current = null;
          }}
          onBlur={() => {
            void runSlugCheck(slug);
          }}
          placeholder={slugPlaceholder}
          aria-invalid={Boolean(slugError)}
          aria-describedby={slugError ? `${slugName}-error` : undefined}
        />
        {slugError ? (
          <p id={`${slugName}-error`} className="mt-1 text-xs text-red-400">
            {slugError}
          </p>
        ) : slugChecking ? (
          <p className="mt-1 text-xs text-[color:var(--muted)]">Checking slug…</p>
        ) : !slugManual ? (
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Generated from {sourceLabel.toLowerCase()}. Edit to customize.
          </p>
        ) : null}
      </div>
    </>
  );
}
