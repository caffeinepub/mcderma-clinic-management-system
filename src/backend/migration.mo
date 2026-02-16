import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";

module {
  public type Appointment = {
    id : Nat;
    patientName : Text;
    mobile : Text;
    appointmentTime : Nat;
    notes : Text;
    isFollowUp : Bool;
  };

  public type Patient = {
    image : ?Blob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
  };

  public type Lead = {
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

  public type UserProfile = {
    username : Text;
    clinicName : Text;
  };

  public type OldUserData = {
    profile : UserProfile;
    hashedPassword : Blob;
    appointments : Map.Map<Nat, Appointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, Patient>;
    leads : Map.Map<Text, Lead>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    profileLastModified : Time.Time;
  };

  public type NewUserData = {
    profile : UserProfile;
    hashedPassword : Blob;
    appointments : Map.Map<Nat, Appointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, Patient>;
    leads : Map.Map<Text, Lead>;
    staff : Map.Map<Text, { name : Text; role : Text }>;
    attendance : Map.Map<Text, {
      name : Text;
      role : Text;
      timestamp : Int;
    }>;
    attendanceIdCounter : Nat;
    adminConfig : {
      hashedPassword : ?Blob;
      securityQuestion : Text;
      hashedSecurityAnswer : ?Blob;
    };
    staffPermissions : Map.Map<Text, {
      canAccessAppointments : Bool;
      canAccessPatients : Bool;
      canAccessLeads : Bool;
      canAccessSettings : Bool;
      hasFullControl : Bool;
    }>;
    whatsappTemplates : Map.Map<Text, {
      templateName : Text;
      messageContent : Text;
    }>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    staffLastModified : Time.Time;
    profileLastModified : Time.Time;
  };

  type OldState = {
    userData : Map.Map<Principal, OldUserData>;
  };

  type NewState = {
    userData : Map.Map<Principal, NewUserData>;
  };

  public func run(oldState : OldState) : NewState {
    let migratedUserData = oldState.userData.map<Principal, OldUserData, NewUserData>(
      func(_principal, oldUser) {
        {
          oldUser with
          staff = Map.empty<Text, { name : Text; role : Text }>();
          attendance = Map.empty<Text, {
            name : Text;
            role : Text;
            timestamp : Int;
          }>();
          attendanceIdCounter = 0;
          adminConfig = {
            hashedPassword = null;
            securityQuestion = "Which is your favorite colour";
            hashedSecurityAnswer = null;
          };
          staffPermissions = Map.empty<Text, {
            canAccessAppointments : Bool;
            canAccessPatients : Bool;
            canAccessLeads : Bool;
            canAccessSettings : Bool;
            hasFullControl : Bool;
          }>();
          whatsappTemplates = Map.empty<Text, {
            templateName : Text;
            messageContent : Text;
          }>();
          staffLastModified = Time.now();
        };
      }
    );

    { userData = migratedUserData };
  };
};
