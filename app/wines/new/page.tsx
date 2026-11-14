import type { Metadata } from "next";
import { Footer, TopBar } from "@/components/Chrome";
import { AddWineForm } from "./AddWineForm";

export const metadata: Metadata = { title: "Add a wine" };

export default function NewWinePage() {
  return (
    <>
      <TopBar active="add" />
      <main className="dc-page dc-band" style={{ maxWidth: 720 }}>
        <h1 className="t-display-xl">Add a wine</h1>
        <p className="t-body-md t-muted" style={{ margin: "var(--space-sm) 0 var(--space-xl)" }}>
          Can't find it in the catalogue? Add it by hand — only the name is required.
        </p>
        <AddWineForm />
      </main>
      <Footer />
    </>
  );
}
