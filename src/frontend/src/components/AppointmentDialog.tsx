import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Appointment } from "../backend";
import { useContactPicker } from "../hooks/useContactPicker";
import {
  useAddAppointment,
  useGetPatients,
  useUpdateAppointment,
} from "../hooks/useQueries";
import { normalizePhone } from "../utils/phone";
import ContactImportReviewDialog from "./ContactImportReviewDialog";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  prefilledData?: {
    patientName: string;
    mobile: string;
    appointmentTime?: Date;
    notes?: string;
  };
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  prefilledData,
}: AppointmentDialogProps) {
  const isEditing = !!appointment;
  const addAppointment = useAddAppointment();
  const updateAppointment = useUpdateAppointment();
  const { data: patients = [] } = useGetPatients();
  const { pickContact } = useContactPicker();

  const [patientName, setPatientName] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const [notes, setNotes] = useState("");
  const [showContactReview, setShowContactReview] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState("");
  const [selectedContactMobile, setSelectedContactMobile] = useState("");

  // Check if Contact Picker API is supported
  const isContactPickerSupported =
    "contacts" in navigator && "ContactsManager" in window;

  useEffect(() => {
    if (open) {
      if (prefilledData) {
        setPatientName(prefilledData.patientName);
        setMobile(prefilledData.mobile);
        setNotes(prefilledData.notes || "");

        if (prefilledData.appointmentTime) {
          setDate(format(prefilledData.appointmentTime, "yyyy-MM-dd"));
          const hours = prefilledData.appointmentTime.getHours();
          const mins = prefilledData.appointmentTime.getMinutes();

          if (hours === 0) {
            setHour("12");
            setPeriod("AM");
          } else if (hours < 12) {
            setHour(hours.toString().padStart(2, "0"));
            setPeriod("AM");
          } else if (hours === 12) {
            setHour("12");
            setPeriod("PM");
          } else {
            setHour((hours - 12).toString().padStart(2, "0"));
            setPeriod("PM");
          }

          setMinute(mins.toString().padStart(2, "0"));
        } else {
          setDate(format(new Date(), "yyyy-MM-dd"));
        }
      } else if (appointment) {
        setPatientName(appointment.patientName);
        setMobile(appointment.mobile);
        setNotes(appointment.notes);

        const appointmentDate = new Date(
          Number(appointment.appointmentTime) / 1000000,
        );
        setDate(format(appointmentDate, "yyyy-MM-dd"));

        const hours = appointmentDate.getHours();
        const mins = appointmentDate.getMinutes();

        if (hours === 0) {
          setHour("12");
          setPeriod("AM");
        } else if (hours < 12) {
          setHour(hours.toString().padStart(2, "0"));
          setPeriod("AM");
        } else if (hours === 12) {
          setHour("12");
          setPeriod("PM");
        } else {
          setHour((hours - 12).toString().padStart(2, "0"));
          setPeriod("PM");
        }

        setMinute(mins.toString().padStart(2, "0"));
      } else {
        setPatientName("");
        setMobile("");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setHour("12");
        setMinute("00");
        setPeriod("PM");
        setNotes("");
      }
    }
  }, [open, appointment, prefilledData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    let hours = Number.parseInt(hour);
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const appointmentDateTime = new Date(`${date}T00:00`);
    appointmentDateTime.setHours(hours, Number.parseInt(minute), 0, 0);
    const timestamp = BigInt(appointmentDateTime.getTime() * 1000000);

    try {
      if (isEditing && appointment) {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          appointment: {
            id: appointment.id,
            patientName,
            mobile,
            appointmentTime: timestamp,
            notes,
            isFollowUp: appointment.isFollowUp,
          },
        });
        toast.success("Appointment updated successfully");
      } else {
        // Check if patient exists before creating appointment
        const normalizedMobile = normalizePhone(mobile);
        const patientExists = patients.some(
          (p) => normalizePhone(p.mobile) === normalizedMobile,
        );

        // If patient doesn't exist, they will be auto-created by the backend
        await addAppointment.mutateAsync({
          patientName,
          mobile,
          appointmentTime: timestamp,
          notes,
        });

        if (!patientExists) {
          toast.success("Appointment created and patient added successfully");
        } else {
          toast.success("Appointment created successfully");
        }
      }
      onOpenChange(false);
    } catch (_error) {
      console.error("Appointment save error:", _error);
      toast.error(
        isEditing
          ? "Failed to update appointment"
          : "Failed to create appointment",
      );
    }
  };

  const handleImportContact = async () => {
    try {
      const contact = await pickContact();
      if (contact) {
        setSelectedContactName(contact.name);
        setSelectedContactMobile(contact.mobile);
        setShowContactReview(true);
      }
    } catch (error: any) {
      if (error.message !== "User cancelled contact selection") {
        toast.error("Failed to import contact");
      }
    }
  };

  const handleContactConfirm = (name: string, mobile: string) => {
    setPatientName(name);
    setMobile(mobile);
    setShowContactReview(false);
    setSelectedContactName("");
    setSelectedContactMobile("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Appointment" : "New Appointment"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <div className="flex gap-2">
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  required
                  className="flex-1"
                />
                {isContactPickerSupported && !isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleImportContact}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                  +91
                </span>
                <Input
                  className="rounded-l-none flex-1"
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                data-ocid="appointment.input"
              />
            </div>

            <div className="space-y-2">
              <Label>Appointment Time</Label>
              <div className="flex gap-2">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const h = (i + 1).toString().padStart(2, "0");
                      return (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v as "AM" | "PM")}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Treatment</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter appointment notes or treatment details"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  addAppointment.isPending || updateAppointment.isPending
                }
              >
                {addAppointment.isPending || updateAppointment.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ContactImportReviewDialog
        open={showContactReview}
        onOpenChange={setShowContactReview}
        contactName={selectedContactName}
        contactMobile={selectedContactMobile}
        onConfirm={handleContactConfirm}
      />
    </>
  );
}
