import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import PatientCard from "../components/PatientCard";
import PatientDialog from "../components/PatientDialog";
import { useGetPatients } from "../hooks/useQueries";
import type { PatientView } from "../hooks/useQueries";
import { getTreatmentsList } from "../utils/treatmentsList";

export default function PatientsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientView | undefined>(
    undefined,
  );

  const { data: patients = [], isLoading } = useGetPatients();
  const treatments = getTreatmentsList();

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mobile.includes(searchQuery) ||
      patient.area.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (treatmentFilter) {
      const notes = (patient.notes || "").toLowerCase();
      return notes.includes(treatmentFilter.toLowerCase());
    }

    return true;
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPatient(undefined);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Section */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Patients</CardTitle>
                <CardDescription className="text-base">
                  Manage your patient records
                </CardDescription>
              </div>
            </div>
            {/* Total Patient Count Badge */}
            <div
              className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 min-w-[64px]"
              data-ocid="patients.total_count.card"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/70 leading-none mb-0.5">
                Total
              </span>
              <span className="text-xl font-bold text-primary leading-none">
                {isLoading ? "—" : patients.length}
              </span>
              <span className="text-[10px] font-medium text-primary/70 leading-none mt-0.5">
                Patients
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, mobile, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
              data-ocid="patients.search_input"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
              <SelectTrigger
                className="flex-1 h-10"
                data-ocid="patients.treatment_filter.select"
              >
                <SelectValue placeholder="Filter by treatment..." />
              </SelectTrigger>
              <SelectContent>
                {treatments.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {treatmentFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTreatmentFilter("")}
                className="text-muted-foreground"
                data-ocid="patients.treatment_filter_clear.button"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      {isLoading ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-base">Loading patients...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredPatients.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">
                {searchQuery ? "No patients found" : "No patients yet"}
              </p>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Add your first patient to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.mobile} patient={patient} />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={() => setIsDialogOpen(true)}
        size="lg"
        className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-40"
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* Add/Edit Patient Dialog */}
      <PatientDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        prefilledData={editingPatient}
      />
    </div>
  );
}
