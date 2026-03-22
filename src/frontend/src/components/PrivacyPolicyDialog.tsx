import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyDialog({
  open,
  onClose,
}: PrivacyPolicyDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-ocid="privacy_policy.modal"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
          data-ocid="privacy_policy.close_button"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Privacy Policy</h2>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Client Appointment Management &mdash; Last Updated: March 2026
            </p>
          </div>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              Data We Collect
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              We collect the following information to provide clinic management
              services:
            </p>
            <ul className="text-sm text-foreground space-y-1 ml-4 list-disc">
              <li>Patient names and mobile numbers</li>
              <li>Appointment details (date, time, treatment)</li>
              <li>Prescription records (digital and photo)</li>
              <li>Staff attendance records</li>
              <li>Lead and follow-up information</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              How Data is Stored
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              All data is stored securely on the{" "}
              <strong>Internet Computer blockchain network</strong>. Data is
              user-specific and only accessible to authorized users of your
              clinic. Your data is stored in a decentralized manner ensuring
              high availability and tamper resistance.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              Data Sharing
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              We <strong>do not share your data with any third parties</strong>.
              Your clinic data remains private and confidential. We do not sell,
              rent, or trade any personal information collected through this
              application.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              Data Security
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              All data is encrypted and protected using industry-standard
              security measures. Only logged-in admin and staff with appropriate
              permissions can access the data. Role-based access control ensures
              each staff member sees only the information relevant to their
              role.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                5
              </span>
              Your Rights
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              You have the right to access, modify, export, or delete your data
              at any time. You can export your data from the{" "}
              <strong>Settings &rarr; Data</strong> section. To request deletion
              of all data, please contact your clinic administrator.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                6
              </span>
              Contact
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              For any privacy concerns, questions, or requests regarding your
              data, please contact your clinic administrator directly. They are
              responsible for managing data access within the application.
            </p>
          </section>

          <Separator />

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground text-center">
              This privacy policy applies to the{" "}
              <strong>Client Appointment Management</strong> app. By using this
              application, you agree to the terms outlined in this policy.
            </p>
          </div>

          <div className="pb-8">
            <Button
              onClick={onClose}
              className="w-full"
              data-ocid="privacy_policy.confirm_button"
            >
              I Understand
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
