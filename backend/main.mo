import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Make sure to keep the with-clause in the main file
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  type Credentials = {
    hashedPassword : Blob;
    username : Text;
  };

  type Appointment = {
    id : Nat;
    patientName : Text;
    mobile : Text;
    appointmentTime : Nat;
    notes : Text;
    isFollowUp : Bool;
    assignedDoctor : ?Text;
  };

  type Patient = {
    image : ?Storage.ExternalBlob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
    prescriptionHistory : List.List<Prescription>;
  };

  type PatientView = {
    image : ?Storage.ExternalBlob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
    prescriptionHistory : [Prescription];
  };

  type Lead = {
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

  type UserProfile = {
    username : Text;
    clinicName : Text;
  };

  type Staff = {
    name : Text;
    role : Text;
  };

  type Attendance = {
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
      #freehand : Storage.ExternalBlob;
      #camera : Storage.ExternalBlob;
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

  type UserData = {
    profile : UserProfile;
    hashedPassword : Blob;
    appointments : Map.Map<Nat, Appointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, Patient>;
    leads : Map.Map<Text, Lead>;
    staff : Map.Map<Text, Staff>;
    attendance : Map.Map<Text, Attendance>;
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

  let userData = Map.empty<Principal, UserData>();
  let usernameToPrincipal = Map.empty<Text, Principal>();
  let syncData = Map.empty<Principal, Time.Time>();

  func getOrInitializeUserData(caller : Principal) : UserData {
    switch (userData.get(caller)) {
      case (?existingData) { existingData };
      case (null) {
        let newUserData : UserData = {
          profile = {
            username = "";
            clinicName = "";
          };
          hashedPassword = "" : Blob;
          appointments = Map.empty<Nat, Appointment>();
          appointmentIdCounter = 0;
          patients = Map.empty<Text, Patient>();
          leads = Map.empty<Text, Lead>();
          staff = Map.empty<Text, Staff>();
          attendance = Map.empty<Text, Attendance>();
          attendanceIdCounter = 0;
          adminConfig = {
            hashedPassword = null;
            securityQuestion = "Which is your favorite colour";
            hashedSecurityAnswer = null;
          };
          staffPermissions = Map.empty<Text, StaffPermissions>();
          whatsappTemplates = Map.empty<Text, WhatsAppTemplate>();
          appointmentsLastModified = Time.now();
          patientsLastModified = Time.now();
          leadsLastModified = Time.now();
          staffLastModified = Time.now();
          profileLastModified = Time.now();
          prescriptionsLastModified = Time.now();
        };
        userData.add(caller, newUserData);
        newUserData;
      };
    };
  };

  public shared ({ caller }) func assignDoctorToAppointment(appointmentId : Nat, doctorName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can assign doctors");
    };

    let userData = getOrInitializeUserData(caller);
    switch (userData.appointments.get(appointmentId)) {
      case (?appointment) {
        let updatedAppointment = {
          appointment with
          assignedDoctor = ?doctorName;
        };
        userData.appointments.add(appointmentId, updatedAppointment);
      };
      case (null) {
        Runtime.trap("Appointment not found");
      };
    };
  };

  public query ({ caller }) func getStaffByRole(role : Text) : async [Staff] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.staff.values().toArray().filter(func(staff) { staff.role == role });
      };
      case (null) { [] };
    };
  };

  // ... all other code unchanged!
};
