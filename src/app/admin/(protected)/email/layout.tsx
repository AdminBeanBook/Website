import { EmailTabs } from "@/components/admin/EmailTabs";

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Write an email, pick who it goes to, and send. Templates and sent mail
          are in the tabs above.
        </p>
      </div>
      <EmailTabs />
      {children}
    </div>
  );
}
