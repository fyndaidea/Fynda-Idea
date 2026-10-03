import SubmitIdeaForm from "@/components/SubmitIdeaForm";
import { Container } from "@/components/ui";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

export const metadata = {
  title: "Submit an idea",
  description: "Suggest a startup or product idea for the Fynda Idea collection.",
};

export default function SubmitPage() {
  return (
    <Container className="max-w-3xl py-10 sm:py-12">
      <h1 className={pageTitleClass}>Submit an idea</h1>
      <p className={pageDescClass}>
        Suggest a startup or product idea for the curated collection. We review every submission
        before it goes live.
      </p>

      <div className="mt-8">
        <SubmitIdeaForm />
      </div>
    </Container>
  );
}
