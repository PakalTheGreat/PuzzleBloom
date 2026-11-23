import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-12">{children}</main>
    </>
  );
}
