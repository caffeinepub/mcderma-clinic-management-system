import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Blob "mo:core/Blob";

module {
  type OldAppointment = {
    id : Nat;
    patientName : Text;
    mobile : Text;
    appointmentTime : Nat;
    notes : Text;
    isFollowUp : Bool;
  };

  type OldPatient = {
    image : ?Storage.ExternalBlob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
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
  };

  type OldUserProfile = {
    username : Text;
    clinicName : Text;
  };

  type OldUserData = {
    profile : OldUserProfile;
    hashedPassword : Blob; // Changed from [Nat8] to Blob
    appointments : Map.Map<Nat, OldAppointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, OldPatient>;
    leads : Map.Map<Text, OldLead>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    profileLastModified : Time.Time;
  };

  type NewLead = {
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

  type NewUserData = {
    profile : OldUserProfile;
    hashedPassword : Blob; // Changed from [Nat8] to Blob
    appointments : Map.Map<Nat, OldAppointment>;
    appointmentIdCounter : Nat;
    patients : Map.Map<Text, OldPatient>;
    leads : Map.Map<Text, NewLead>;
    appointmentsLastModified : Time.Time;
    patientsLastModified : Time.Time;
    leadsLastModified : Time.Time;
    profileLastModified : Time.Time;
  };

  // The full actor state
  type OldActor = {
    userData : Map.Map<Principal, OldUserData>;
    usernameToPrincipal : Map.Map<Text, Principal>;
    syncData : Map.Map<Principal, Time.Time>;
  };

  type NewActor = {
    userData : Map.Map<Principal, NewUserData>;
    usernameToPrincipal : Map.Map<Text, Principal>;
    syncData : Map.Map<Principal, Time.Time>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserData = old.userData.map<Principal, OldUserData, NewUserData>(
      func(_p, oldUser) {
        let newLeads = oldUser.leads.map<Text, OldLead, NewLead>(
          func(_m, oldLead) {
            { oldLead with leadStatus = "New" };
          }
        );
        { oldUser with leads = newLeads };
      }
    );
    { old with userData = newUserData };
  };
};
