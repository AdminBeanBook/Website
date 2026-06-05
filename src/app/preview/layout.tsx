import { PreviewBanner } from "@/components/admin/PreviewBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageMainCanvas } from "@/components/PageMainCanvas";
import { SiteLayoutWrapper } from "@/components/SiteLayoutWrapper";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteLayoutWrapper variant="draft">
      <div className="flex min-h-screen w-full flex-col">
        <PreviewBanner />
        <Header />
        <PageMainCanvas className="min-h-0 w-full flex-1">
          {children}
        </PageMainCanvas>
        <Footer />
      </div>
    </SiteLayoutWrapper>
  );
}
