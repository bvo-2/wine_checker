import Link from "next/link";
import { Footer, TopBar } from "@/components/Chrome";

export default function NotFound() {
  return (
    <>
      <TopBar active="cellar" />
      <main className="dc-page dc-band">
        <div className="dc-empty">
          <h1 className="t-display-xl">We couldn't find that wine</h1>
          <p className="t-body-md">It may have been removed from your cellar, or the link is wrong.</p>
          <Link href="/" className="dc-button dc-button--secondary">Back to your cellar</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
