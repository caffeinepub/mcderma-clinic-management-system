import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  // Old types as they were before migration.
  type OldAppointment = {
    id : Nat;
    patientName : Text;
    mobile : Text;
    appointmentTime : Nat;
    notes : Text;
    isFollowUp : Bool;
  };

  type OldPatient = {
    image : ?Blob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
    prescriptionHistory : List.List<Prescription>;
  };

  type OldLead = {
    leadName : Text;
    mobile : Text;
    treatmentWanted : Text;
    area : Text;
    followUpDate : Int;
    expectedTreatmentDate : Int;
    rating : Nat8;
    doctorRemark : Text;
    addToAppointment : Bool;
    leadStatus : Text;
  };

  type OldStaff = {
    name : Text;
    role : Text;
  };

  type OldAttendance = {
    name : Text;
    role : Text;
    timestamp : Int;
  };

  type AdminConfig = {
    hashedPassword : ?Blob;
    securityQuestion : Text;
    hashedSecurityAnswer : ?Blob;
  };

  type StaffPermissions = {
    canAccessAppointments : Bool;
    canAccessPatients : Bool;
    canAccessLeads : Bool;
    canAccessSettings : Bool;
    hasFullControl : Bool;
  };

  type WhatsAppTemplate = {
    templateName : Text;
    messageContent : Text;
  };

  type Prescription = {
    patientName : Text;
    mobile : Text;
    clinicName : Text;
    prescriptionType : {
      #typed;
      #freehand;
      #camera;
    };
    prescriptionData : {
      #typed : Text;
      #freehand : Blob; // Changed from variant to Blob
      #camera : Blob; // Changed from variant to Blob
    };
    doctorNotes : Text;
    consultationType : {
      #telemedicine;
      #inPerson;
    };
    appointmentId : ?Nat;
    timestamp : Int;
    symptoms : ?Text;
    allergies : ?Text;
    medicalHistory : ?Text;
    followUp : ?Text;
  };

  type UserProfile = {
    username : Text;
    clinicName : Text;
  };

  type OldUserData = {
    profile : UserProfile;
    hashedPassword : Blob;
    appointments : Map.Map<Nat, OldAppointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, OldPatient>;
    leads : Map.Map<Text, OldLead>;
    staff : Map.Map<Text, OldStaff>;
    attendance : Map.Map<Text, OldAttendance>;
    attendanceIdCounter : Nat;
    adminConfig : AdminConfig;
    staffPermissions : Map.Map<Text, StaffPermissions>;
    whatsappTemplates : Map.Map<Text, WhatsAppTemplate>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    staffLastModified : Time.Time;
    profileLastModified : Time.Time;
    prescriptionsLastModified : Time.Time;
  };

  // New types after migration.
  type NewAppointment = {
    id : Nat;
    patientName : Text;
    mobile : Text;
    appointmentTime : Nat;
    notes : Text;
    isFollowUp : Bool;
    assignedDoctor : ?Text; // New field
  };

  type NewUserData = {
    profile : UserProfile;
    hashedPassword : Blob;
    appointments : Map.Map<Nat, NewAppointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, OldPatient>;
    leads : Map.Map<Text, OldLead>;
    staff : Map.Map<Text, OldStaff>;
    attendance : Map.Map<Text, OldAttendance>;
    attendanceIdCounter : Nat;
    adminConfig : AdminConfig;
    staffPermissions : Map.Map<Text, StaffPermissions>;
    whatsappTemplates : Map.Map<Text, WhatsAppTemplate>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    staffLastModified : Time.Time;
    profileLastModified : Time.Time;
    prescriptionsLastModified : Time.Time;
  };

  // Main migration function called during upgrade.
  public func run(old : { userData : Map.Map<Principal, OldUserData> }) : { userData : Map.Map<Principal, NewUserData> } {
    let newUserDataMap = old.userData.map<Principal, OldUserData, NewUserData>(
      func(_userId, oldUserData) {
        {
          oldUserData with
          appointments = oldUserData.appointments.map<Nat, OldAppointment, NewAppointment>(
            func(_id, oldAppointment) {
              { oldAppointment with assignedDoctor = null };
            }
          );
        };
      }
    );
    { userData = newUserDataMap };
  };
};
