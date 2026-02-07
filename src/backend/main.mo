import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

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
  };

  type Patient = {
    image : ?Storage.ExternalBlob;
    name : Text;
    mobile : Text;
    area : Text;
    notes : Text;
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

  type UserData = {
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

  let userData = Map.empty<Principal, UserData>();
  let usernameToPrincipal = Map.empty<Text, Principal>();
  let syncData = Map.empty<Principal, Time.Time>();

  // Helper function to safely get or initialize user data
  func getOrInitializeUserData(caller : Principal) : UserData {
    switch (userData.get(caller)) {
      case (?existingData) {
        existingData;
      };
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
          appointmentsLastModified = Time.now();
          patientsLastModified = Time.now();
          leadsLastModified = Time.now();
          profileLastModified = Time.now();
        };
        userData.add(caller, newUserData);
        newUserData;
      };
    };
  };

  // Public function - no authentication required for registration
  public shared ({ caller }) func register(username : Text, hashedPassword : Blob) : async Text {
    switch (usernameToPrincipal.get(username)) {
      case (?_) {
        Runtime.trap("Username already exists");
      };
      case (null) {
        let currentTime = Time.now();
        let newUserData : UserData = {
          profile = {
            username = username;
            clinicName = "";
          };
          hashedPassword = hashedPassword;
          appointments = Map.empty<Nat, Appointment>();
          appointmentIdCounter = 0;
          patients = Map.empty<Text, Patient>();
          leads = Map.empty<Text, Lead>();
          appointmentsLastModified = currentTime;
          patientsLastModified = currentTime;
          leadsLastModified = currentTime;
          profileLastModified = currentTime;
        };

        userData.add(caller, newUserData);
        usernameToPrincipal.add(username, caller);
        AccessControl.assignRole(accessControlState, caller, caller, #user);

        "Registration successful";
      };
    };
  };

  // Public function - no authentication required for login
  public shared ({ caller }) func login(username : Text, hashedPassword : Blob) : async Text {
    switch (usernameToPrincipal.get(username)) {
      case (?userPrincipal) {
        switch (userData.get(userPrincipal)) {
          case (?data) {
            if (Blob.equal(data.hashedPassword, hashedPassword)) {
              AccessControl.assignRole(accessControlState, caller, caller, #user);

              if (not Principal.equal(caller, userPrincipal)) {
                userData.add(caller, data);
                usernameToPrincipal.add(username, caller);
              };

              "Login successful";
            } else {
              Runtime.trap("Invalid username or password");
            };
          };
          case (null) {
            Runtime.trap("Invalid username or password");
          };
        };
      };
      case (null) {
        Runtime.trap("Invalid username or password");
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.profile };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userData.get(user)) {
      case (?data) { ?data.profile };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let currentTime = Time.now();
    let existingUserData = userData.get(caller);

    switch (existingUserData) {
      case (?data) {
        let updatedData : UserData = {
          profile = profile;
          hashedPassword = data.hashedPassword;
          appointments = data.appointments;
          appointmentIdCounter = data.appointmentIdCounter;
          patients = data.patients;
          leads = data.leads;
          appointmentsLastModified = data.appointmentsLastModified;
          patientsLastModified = data.patientsLastModified;
          leadsLastModified = data.leadsLastModified;
          profileLastModified = currentTime;
        };
        userData.add(caller, updatedData);
      };
      case (null) {
        let newData : UserData = {
          profile = profile;
          hashedPassword = "" : Blob;
          appointments = Map.empty<Nat, Appointment>();
          appointmentIdCounter = 0;
          patients = Map.empty<Text, Patient>();
          leads = Map.empty<Text, Lead>();
          appointmentsLastModified = currentTime;
          patientsLastModified = currentTime;
          leadsLastModified = currentTime;
          profileLastModified = currentTime;
        };
        userData.add(caller, newData);
      };
    };
  };

  public shared ({ caller }) func addAppointment(
    patientName : Text,
    mobile : Text,
    appointmentTime : Nat,
    notes : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add appointments");
    };

    let user = getOrInitializeUserData(caller);

    let newAppointment : Appointment = {
      id = user.appointmentIdCounter;
      patientName;
      mobile;
      appointmentTime;
      notes;
      isFollowUp = false;
    };

    let newAppointments = user.appointments.clone();
    newAppointments.add(user.appointmentIdCounter, newAppointment);

    let updatedData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = newAppointments;
      appointmentIdCounter = user.appointmentIdCounter + 1;
      patients = user.patients;
      leads = user.leads;
      appointmentsLastModified = Time.now();
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = user.leadsLastModified;
      profileLastModified = user.profileLastModified;
    };

    userData.add(caller, updatedData);
    "Successfully stored appointment!";
  };

  public query ({ caller }) func getAppointments() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.appointments.values().toArray();
      };
      case (null) { [] };
    };
  };

  func sortAppointmentsByTime(appointments : Map.Map<Nat, Appointment>) : List.List<Appointment> {
    let appointmentsArray = appointments.values().toArray();
    let sortedArray = appointmentsArray.sort(
      func(a, b) {
        if (a.appointmentTime < b.appointmentTime) {
          return #less;
        } else if (a.appointmentTime > b.appointmentTime) {
          return #greater;
        };
        #equal;
      }
    );
    List.fromArray<Appointment>(sortedArray);
  };

  public query ({ caller }) func getTodaysAppointmentsSorted() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        let todayStart = Time.now() / 86400000000000;
        let filteredArray = data.appointments.values().toArray().filter(
          func(appointment) {
            appointment.appointmentTime / 86400000000000 == todayStart
          }
        );
        let filteredList = List.fromArray<Appointment>(filteredArray);
        let sortedList = filteredList.toArray().sort(
          func(a, b) {
            if (a.appointmentTime < b.appointmentTime) { #less } else if (a.appointmentTime > b.appointmentTime) {
              #greater;
            } else { #equal };
          }
        );
        sortedList;
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getTomorrowAppointmentsSorted() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        let tomorrowStart = (Time.now() + 86400000000000) / 86400000000000;
        let filteredArray = data.appointments.values().toArray().filter(
          func(appointment) {
            appointment.appointmentTime / 86400000000000 == tomorrowStart
          }
        );
        let filteredList = List.fromArray<Appointment>(filteredArray);
        let sortedList = filteredList.toArray().sort(
          func(a, b) {
            if (a.appointmentTime < b.appointmentTime) { #less } else if (a.appointmentTime > b.appointmentTime) {
              #greater;
            } else { #equal };
          }
        );
        sortedList;
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getUpcomingAppointmentsSorted() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        let dayAfterTomorrowStart = (Time.now() + (86400000000000 * 2)) / 86400000000000;
        let filteredArray = data.appointments.values().toArray().filter(
          func(appointment) {
            appointment.appointmentTime / 86400000000000 >= dayAfterTomorrowStart
          }
        );
        let filteredList = List.fromArray<Appointment>(filteredArray);
        let sortedList = filteredList.toArray().sort(
          func(a, b) {
            if (a.appointmentTime < b.appointmentTime) { #less } else if (a.appointmentTime > b.appointmentTime) {
              #greater;
            } else { #equal };
          }
        );
        sortedList;
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updateAppointment(id : Nat, updatedAppointment : Appointment) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        if (data.appointments.containsKey(id)) {
          let newAppointments = data.appointments.clone();
          newAppointments.add(id, updatedAppointment);

          let updatedUserData : UserData = {
            profile = data.profile;
            hashedPassword = data.hashedPassword;
            appointments = newAppointments;
            appointmentIdCounter = data.appointmentIdCounter;
            patients = data.patients;
            leads = data.leads;
            appointmentsLastModified = Time.now();
            patientsLastModified = data.patientsLastModified;
            leadsLastModified = data.leadsLastModified;
            profileLastModified = data.profileLastModified;
          };

          userData.add(caller, updatedUserData);
          "Appointment updated successfully!";
        } else {
          Runtime.trap("Appointment not found");
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func toggleFollowUpAppointment(id : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.appointments.get(id)) {
          case (?existingAppointment) {
            let updatedAppointment = {
              existingAppointment with isFollowUp = not existingAppointment.isFollowUp;
            };
            let newAppointments = data.appointments.clone();
            newAppointments.add(id, updatedAppointment);

            let updatedUserData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = newAppointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              appointmentsLastModified = Time.now();
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = data.leadsLastModified;
              profileLastModified = data.profileLastModified;
            };

            userData.add(caller, updatedUserData);
            "Toggle follow-up status successfully!";
          };
          case (null) { Runtime.trap("Appointment not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func deleteAppointment(id : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete appointments");
    };

    switch (userData.get(caller)) {
      case (?data) {
        if (data.appointments.containsKey(id)) {
          let newAppointments = data.appointments.clone();
          newAppointments.remove(id);

          let updatedUserData : UserData = {
            profile = data.profile;
            hashedPassword = data.hashedPassword;
            appointments = newAppointments;
            appointmentIdCounter = data.appointmentIdCounter;
            patients = data.patients;
            leads = data.leads;
            appointmentsLastModified = Time.now();
            patientsLastModified = data.patientsLastModified;
            leadsLastModified = data.leadsLastModified;
            profileLastModified = data.profileLastModified;
          };

          userData.add(caller, updatedUserData);
          "Appointment deleted successfully!";
        } else {
          Runtime.trap("Appointment not found");
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func addPatient(image : ?Storage.ExternalBlob, name : Text, mobile : Text, area : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add patients");
    };

    let patient : Patient = {
      image;
      name;
      mobile;
      area;
      notes;
    };

    let currentTime = Time.now();
    let user = getOrInitializeUserData(caller);

    let updatedPatients = user.patients.clone();
    updatedPatients.add(mobile, patient);

    let updatedData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter;
      patients = updatedPatients;
      leads = user.leads;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = currentTime;
      leadsLastModified = user.leadsLastModified;
      profileLastModified = user.profileLastModified;
    };

    userData.add(caller, updatedData);
    "Successfully stored patient!";
  };

  public query ({ caller }) func getPatients() : async [Patient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view patients");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.patients.values().toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updatePatient(mobile : Text, image : ?Storage.ExternalBlob, name : Text, newMobile : Text, area : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update patients");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.patients.get(mobile)) {
          case (?_) {
            data.patients.remove(mobile);
            let updatedPatient : Patient = {
              image;
              name;
              mobile = newMobile;
              area;
              notes;
            };

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = data.leadsLastModified;
              profileLastModified = data.profileLastModified;
            };
            data.patients.add(newMobile, updatedPatient);
            userData.add(caller, updatedData);
            "Patient updated successfully!";
          };
          case (null) { Runtime.trap("Patient not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func deletePatient(mobile : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete patients");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.patients.get(mobile)) {
          case (?_) {
            data.patients.remove(mobile);

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = data.leadsLastModified;
              profileLastModified = data.profileLastModified;
            };
            userData.add(caller, updatedData);
            "Patient deleted successfully!";
          };
          case (null) { Runtime.trap("Patient not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func addLead(
    leadName : Text,
    mobile : Text,
    treatmentWanted : Text,
    area : Text,
    followUpDate : Int,
    expectedTreatmentDate : Int,
    rating : Nat8,
    doctorRemark : Text,
    addToAppointment : Bool,
    leadStatus : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add leads");
    };

    let lead : Lead = {
      leadName;
      mobile;
      treatmentWanted;
      area;
      followUpDate;
      expectedTreatmentDate;
      rating;
      doctorRemark;
      addToAppointment;
      leadStatus;
    };

    let currentTime = Time.now();
    let user = getOrInitializeUserData(caller);

    let updatedLeads = user.leads.clone();
    updatedLeads.add(mobile, lead);

    let updatedData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter;
      patients = user.patients;
      leads = updatedLeads;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = currentTime;
      profileLastModified = user.profileLastModified;
    };

    userData.add(caller, updatedData);
    "Successfully stored lead!";
  };

  public query ({ caller }) func getLeads() : async [Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leads");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.leads.values().toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updateLead(
    mobile : Text,
    leadName : Text,
    newMobile : Text,
    treatmentWanted : Text,
    area : Text,
    followUpDate : Int,
    expectedTreatmentDate : Int,
    rating : Nat8,
    doctorRemark : Text,
    addToAppointment : Bool,
    leadStatus : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update leads");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.leads.get(mobile)) {
          case (?_) {
            data.leads.remove(mobile);
            let updatedLead : Lead = {
              leadName;
              mobile = newMobile;
              treatmentWanted;
              area;
              followUpDate;
              expectedTreatmentDate;
              rating;
              doctorRemark;
              addToAppointment;
              leadStatus;
            };

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = Time.now();
              profileLastModified = data.profileLastModified;
            };
            data.leads.add(newMobile, updatedLead);
            userData.add(caller, updatedData);
            "Lead updated successfully!";
          };
          case (null) { Runtime.trap("Lead not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func deleteLead(mobile : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete leads");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.leads.get(mobile)) {
          case (?_) {
            data.leads.remove(mobile);

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = Time.now();
              profileLastModified = data.profileLastModified;
            };
            userData.add(caller, updatedData);
            "Lead deleted successfully!";
          };
          case (null) { Runtime.trap("Lead not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getLastSyncTime() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sync data");
    };
    syncData.get(caller);
  };

  public query ({ caller }) func getLastModified() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.profileLastModified };
      case (null) { null };
    };
  };

  public shared ({ caller }) func updateLastSyncTime() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sync data");
    };
    syncData.add(caller, Time.now());
  };

  public query ({ caller }) func getLastModifiedTimes() : async {
    appointments : ?Time.Time;
    patients : ?Time.Time;
    leads : ?Time.Time;
    profile : ?Time.Time;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) {
        {
          appointments = ?data.appointmentsLastModified;
          patients = ?data.patientsLastModified;
          leads = ?data.leadsLastModified;
          profile = ?data.profileLastModified;
        };
      };
      case (null) {
        { appointments = null; patients = null; leads = null; profile = null };
      };
    };
  };

  public query ({ caller }) func getLastModifiedAppointments() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.appointmentsLastModified };
      case (null) { null };
    };
  };

  public query ({ caller }) func getLastModifiedPatients() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.patientsLastModified };
      case (null) { null };
    };
  };

  public query ({ caller }) func getLastModifiedLeads() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.leadsLastModified };
      case (null) { null };
    };
  };

  public query ({ caller }) func getLastModifiedProfile() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access modification data");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.profileLastModified };
      case (null) { null };
    };
  };
};
