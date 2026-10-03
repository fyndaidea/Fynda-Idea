import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Share ideas, vote on requests, read the roadmap, and see release notes for Fynda Idea.",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
