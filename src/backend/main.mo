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
          appointmentsLastModified = currentTime;
          patientsLastModified = currentTime;
          leadsLastModified = currentTime;
          staffLastModified = currentTime;
          profileLastModified = currentTime;
          prescriptionsLastModified = currentTime;
        };

        userData.add(caller, newUserData);
        usernameToPrincipal.add(username, caller);
        AccessControl.assignRole(accessControlState, caller, caller, #user);

        "Registration successful";
      };
    };
  };

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
          staff = data.staff;
          attendance = data.attendance;
          attendanceIdCounter = data.attendanceIdCounter;
          adminConfig = data.adminConfig;
          staffPermissions = data.staffPermissions;
          whatsappTemplates = data.whatsappTemplates;
          appointmentsLastModified = data.appointmentsLastModified;
          patientsLastModified = data.patientsLastModified;
          leadsLastModified = data.leadsLastModified;
          staffLastModified = data.staffLastModified;
          profileLastModified = currentTime;
          prescriptionsLastModified = data.prescriptionsLastModified;
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
          appointmentsLastModified = currentTime;
          patientsLastModified = currentTime;
          leadsLastModified = currentTime;
          staffLastModified = currentTime;
          profileLastModified = currentTime;
          prescriptionsLastModified = currentTime;
        };
        userData.add(caller, newData);
      };
    };
  };

  // ADMIN PASSWORD MANAGEMENT
  public shared ({ caller }) func setAdminPassword(hashedPassword : Blob, securityQuestion : Text, hashedSecurityAnswer : Blob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set admin password");
    };

    let user = getOrInitializeUserData(caller);

    let updatedAdminConfig : AdminConfig = {
      hashedPassword = ?hashedPassword;
      securityQuestion = securityQuestion;
      hashedSecurityAnswer = ?hashedSecurityAnswer;
    };

    let updatedData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter;
      patients = user.patients;
      leads = user.leads;
      staff = user.staff;
      attendance = user.attendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = updatedAdminConfig;
      staffPermissions = user.staffPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = user.leadsLastModified;
      staffLastModified = user.staffLastModified;
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
    };

    userData.add(caller, updatedData);
    "Admin password set successfully";
  };

  public query ({ caller }) func getAdminConfig() : async ?AdminConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view admin config");
    };

    switch (userData.get(caller)) {
      case (?data) { ?data.adminConfig };
      case (null) { null };
    };
  };

  public shared ({ caller }) func verifyAdminPassword(hashedPassword : Blob) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify admin password");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.adminConfig.hashedPassword) {
          case (?storedHash) {
            Blob.equal(storedHash, hashedPassword);
          };
          case (null) { false };
        };
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func unlockAdmin(hashedSecurityAnswer : Blob) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlock admin");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.adminConfig.hashedSecurityAnswer) {
          case (?storedAnswer) {
            Blob.equal(storedAnswer, hashedSecurityAnswer);
          };
          case (null) { false };
        };
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func resetAdminPassword(hashedSecurityAnswer : Blob, newHashedPassword : Blob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset admin password");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.adminConfig.hashedSecurityAnswer) {
          case (?storedAnswer) {
            if (Blob.equal(storedAnswer, hashedSecurityAnswer)) {
              let updatedAdminConfig : AdminConfig = {
                hashedPassword = ?newHashedPassword;
                securityQuestion = data.adminConfig.securityQuestion;
                hashedSecurityAnswer = data.adminConfig.hashedSecurityAnswer;
              };

              let updatedData : UserData = {
                profile = data.profile;
                hashedPassword = data.hashedPassword;
                appointments = data.appointments;
                appointmentIdCounter = data.appointmentIdCounter;
                patients = data.patients;
                leads = data.leads;
                staff = data.staff;
                attendance = data.attendance;
                attendanceIdCounter = data.attendanceIdCounter;
                adminConfig = updatedAdminConfig;
                staffPermissions = data.staffPermissions;
                whatsappTemplates = data.whatsappTemplates;
                appointmentsLastModified = data.appointmentsLastModified;
                patientsLastModified = data.patientsLastModified;
                leadsLastModified = data.leadsLastModified;
                staffLastModified = data.staffLastModified;
                profileLastModified = data.profileLastModified;
                prescriptionsLastModified = data.prescriptionsLastModified;
              };

              userData.add(caller, updatedData);
              "Admin password reset successfully";
            } else {
              Runtime.trap("Invalid security answer");
            };
          };
          case (null) {
            Runtime.trap("Security answer not set");
          };
        };
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  // STAFF MANAGEMENT
  public shared ({ caller }) func addStaff(name : Text, role : Text, permissions : StaffPermissions) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add staff members");
    };

    let user = getOrInitializeUserData(caller);
    let staff : Staff = { name; role };

    let updatedStaff = user.staff.clone();
    updatedStaff.add(name, staff);

    let updatedPermissions = user.staffPermissions.clone();
    updatedPermissions.add(name, permissions);

    let updatedData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter;
      patients = user.patients;
      leads = user.leads;
      staff = updatedStaff;
      attendance = user.attendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = user.adminConfig;
      staffPermissions = updatedPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = user.leadsLastModified;
      staffLastModified = Time.now();
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
    };

    userData.add(caller, updatedData);
    "Staff member added successfully";
  };

  public query ({ caller }) func getStaff() : async [Staff] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.staff.values().toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getStaffPermissions(staffName : Text) : async ?StaffPermissions {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff permissions");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.staffPermissions.get(staffName);
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func updateStaffPermissions(staffName : Text, permissions : StaffPermissions) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update staff permissions");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.staff.get(staffName)) {
          case (?_) {
            let updatedPermissions = data.staffPermissions.clone();
            updatedPermissions.add(staffName, permissions);

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = updatedPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = data.leadsLastModified;
              staffLastModified = Time.now();
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
            };

            userData.add(caller, updatedData);
            "Staff permissions updated successfully";
          };
          case (null) { Runtime.trap("Staff member not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func deleteStaff(staffName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete staff members");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.staff.get(staffName)) {
          case (?_) {
            data.staff.remove(staffName);
            data.staffPermissions.remove(staffName);

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = data.leadsLastModified;
              staffLastModified = Time.now();
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
            };

            userData.add(caller, updatedData);
            "Staff member deleted successfully";
          };
          case (null) { Runtime.trap("Staff member not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  // PRESCRIPTION WORKFLOW
  public shared ({ caller }) func savePrescription(prescription : Prescription) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save prescriptions");
    };

    switch (userData.get(caller)) {
      case (?user) {
        switch (user.patients.get(prescription.mobile)) {
          case (?patient) {
            patient.prescriptionHistory.add(prescription);

            let updatedPatients = user.patients.clone();
            updatedPatients.add(prescription.mobile, patient);

            let updatedData : UserData = {
              profile = user.profile;
              hashedPassword = user.hashedPassword;
              appointments = user.appointments;
              appointmentIdCounter = user.appointmentIdCounter;
              leads = user.leads;
              staff = user.staff;
              attendance = user.attendance;
              attendanceIdCounter = user.attendanceIdCounter;
              adminConfig = user.adminConfig;
              staffPermissions = user.staffPermissions;
              whatsappTemplates = user.whatsappTemplates;
              patients = updatedPatients;
              appointmentsLastModified = user.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = user.leadsLastModified;
              staffLastModified = user.staffLastModified;
              profileLastModified = user.profileLastModified;
              prescriptionsLastModified = Time.now();
            };

            userData.add(caller, updatedData);
            "Prescription saved successfully!";
          };
          case (null) {
            let newPatientPrescriptions = List.empty<Prescription>();
            newPatientPrescriptions.add(prescription);

            let newPatient : Patient = {
              image = null;
              name = prescription.patientName;
              mobile = prescription.mobile;
              area = "";
              notes = "";
              prescriptionHistory = newPatientPrescriptions;
            };

            let updatedPatients = user.patients.clone();
            updatedPatients.add(prescription.mobile, newPatient);

            let updatedData : UserData = {
              profile = user.profile;
              hashedPassword = user.hashedPassword;
              appointments = user.appointments;
              appointmentIdCounter = user.appointmentIdCounter;
              leads = user.leads;
              staff = user.staff;
              attendance = user.attendance;
              attendanceIdCounter = user.attendanceIdCounter;
              adminConfig = user.adminConfig;
              staffPermissions = user.staffPermissions;
              whatsappTemplates = user.whatsappTemplates;
              patients = updatedPatients;
              appointmentsLastModified = user.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = user.leadsLastModified;
              staffLastModified = user.staffLastModified;
              profileLastModified = user.profileLastModified;
              prescriptionsLastModified = Time.now();
            };

            userData.add(caller, updatedData);
            "Prescription saved successfully!";
          };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getPrescriptions(patientMobile : Text) : async [Prescription] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view prescriptions");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.patients.get(patientMobile)) {
          case (?patient) { patient.prescriptionHistory.toArray() };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getPrescriptionById(patientMobile : Text, id : Nat) : async ?Prescription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view prescription.");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.patients.get(patientMobile)) {
          case (?patient) {
            if (id < patient.prescriptionHistory.size()) { ?patient.prescriptionHistory.toArray()[id] } else {
              null;
            };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func deletePrescription(patientMobile : Text, id : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete prescriptions");
    };

    switch (userData.get(caller)) {
      case (?data) {
        switch (data.patients.get(patientMobile)) {
          case (?patient) {
            if (id < patient.prescriptionHistory.size()) {
              let prescriptionsArray = patient.prescriptionHistory.toArray();

              patient.prescriptionHistory.clear();
              for (i in Nat.range(0, prescriptionsArray.size())) {
                if (i != id) {
                  patient.prescriptionHistory.add(prescriptionsArray[i]);
                };
              };

              let updatedPatients = data.patients.clone();
              updatedPatients.add(patientMobile, patient);

              let updatedUserData : UserData = {
                profile = data.profile;
                hashedPassword = data.hashedPassword;
                appointments = data.appointments;
                appointmentIdCounter = data.appointmentIdCounter;
                leads = data.leads;
                staff = data.staff;
                attendance = data.attendance;
                attendanceIdCounter = data.attendanceIdCounter;
                adminConfig = data.adminConfig;
                staffPermissions = data.staffPermissions;
                whatsappTemplates = data.whatsappTemplates;
                patients = updatedPatients;
                appointmentsLastModified = data.appointmentsLastModified;
                patientsLastModified = Time.now();
                leadsLastModified = data.leadsLastModified;
                staffLastModified = data.staffLastModified;
                profileLastModified = data.profileLastModified;
                prescriptionsLastModified = Time.now();
              };

              userData.add(caller, updatedUserData);
              "Prescription deleted successfully!";
            } else {
              Runtime.trap("Prescription not found");
            };
          };
          case (null) { Runtime.trap("Patient not found") };
        };
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getPrescriptionsLastModified() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view last modified timestamp");
    };
    switch (userData.get(caller)) {
      case (?data) { ?data.prescriptionsLastModified };
      case (null) { null };
    };
  };

  // ATTENDANCE MANAGEMENT

  // Not needed on backend since logic is same as createAttendance
  // public shared ({ caller }) func checkIn(name : Text, role : Text) : async Bool {
  //   if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
  //     Runtime.trap("Unauthorized: Only users can create attendance records");
  //   };

  //   let timestamp = Time.now();
  //   let user = getOrInitializeUserData(caller);
  //   let newAttendance : Attendance = { name; role; timestamp };

  //   let updatedAttendance = user.attendance.clone();
  //   updatedAttendance.add(timestamp.toText(), newAttendance);

  //   let updatedUserData : UserData = {
  //     profile = user.profile;
  //     hashedPassword = user.hashedPassword;
  //     appointments = user.appointments;
  //     appointmentIdCounter = user.appointmentIdCounter + 1;
  //     patients = user.patients;
  //     leads = user.leads;
  //     staff = user.staff;
  //     attendance = updatedAttendance;
  //     attendanceIdCounter = user.attendanceIdCounter;
  //     adminConfig = user.adminConfig;
  //     staffPermissions = user.staffPermissions;
  //     whatsappTemplates = user.whatsappTemplates;
  //     appointmentsLastModified = user.appointmentsLastModified;
  //     patientsLastModified = user.patientsLastModified;
  //     leadsLastModified = user.leadsLastModified;
  //     staffLastModified = user.staffLastModified;
  //     profileLastModified = user.profileLastModified;
  //     prescriptionsLastModified = user.prescriptionsLastModified;
  //   };

  //   userData.add(caller, updatedUserData);
  //   true;
  // };

  public shared ({ caller }) func createAttendance(name : Text, role : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create attendance records");
    };

    let timestamp = Time.now();
    let user = getOrInitializeUserData(caller);
    let newAttendance : Attendance = { name; role; timestamp };

    let updatedAttendance = user.attendance.clone();
    updatedAttendance.add(timestamp.toText(), newAttendance);

    let updatedUserData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter + 1;
      patients = user.patients;
      leads = user.leads;
      staff = user.staff;
      attendance = updatedAttendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = user.adminConfig;
      staffPermissions = user.staffPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = user.leadsLastModified;
      staffLastModified = user.staffLastModified;
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
    };

    userData.add(caller, updatedUserData);
    true;
  };

  public query ({ caller }) func getAttendance() : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.attendance.values().toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updateAttendance(_timestamp : Text, name : Text, role : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update attendance");
    };

    let timestamp = Time.now();
    let user = getOrInitializeUserData(caller);

    let newAttendance : Attendance = { name; role; timestamp };
    user.attendance.add(timestamp.toText(), newAttendance);

    let updatedUserData : UserData = {
      profile = user.profile;
      hashedPassword = user.hashedPassword;
      appointments = user.appointments;
      appointmentIdCounter = user.appointmentIdCounter;
      patients = user.patients;
      leads = user.leads;
      staff = user.staff;
      attendance = user.attendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = user.adminConfig;
      staffPermissions = user.staffPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = user.leadsLastModified;
      staffLastModified = user.staffLastModified;
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
    };

    userData.add(caller, updatedUserData);
    true;
  };

  // LEAD MANAGEMENT
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
      staff = user.staff;
      attendance = user.attendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = user.adminConfig;
      staffPermissions = user.staffPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = user.patientsLastModified;
      leadsLastModified = currentTime;
      staffLastModified = user.staffLastModified;
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
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

            data.leads.add(newMobile, updatedLead);

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = Time.now();
              staffLastModified = data.staffLastModified;
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
            };

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
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = Time.now();
              staffLastModified = data.staffLastModified;
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
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

  // APPOINTMENT MANAGEMENT
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

    // If the patient doesn't exist in the patients map, automatically add them
    if (not user.patients.containsKey(mobile)) {
      let newPatient :
        Patient = {
        image = null;
        name = patientName;
        mobile;
        area = "";
        notes = "";
        prescriptionHistory = List.empty<Prescription>();
      };
      let updatedPatients = user.patients.clone();
      updatedPatients.add(mobile, newPatient);

      let updatedData : UserData = {
        profile = user.profile;
        hashedPassword = user.hashedPassword;
        appointments = newAppointments;
        appointmentIdCounter = user.appointmentIdCounter + 1;
        patients = updatedPatients;
        leads = user.leads;
        staff = user.staff;
        attendance = user.attendance;
        attendanceIdCounter = user.attendanceIdCounter;
        adminConfig = user.adminConfig;
        staffPermissions = user.staffPermissions;
        whatsappTemplates = user.whatsappTemplates;
        appointmentsLastModified = Time.now();
        patientsLastModified = Time.now();
        leadsLastModified = user.leadsLastModified;
        staffLastModified = user.staffLastModified;
        profileLastModified = user.profileLastModified;
        prescriptionsLastModified = user.prescriptionsLastModified;
      };

      userData.add(caller, updatedData);
    } else {
      // If the patient exists, just update the appointments map
      let updatedData : UserData = {
        profile = user.profile;
        hashedPassword = user.hashedPassword;
        appointments = newAppointments;
        appointmentIdCounter = user.appointmentIdCounter + 1;
        patients = user.patients;
        leads = user.leads;
        staff = user.staff;
        attendance = user.attendance;
        attendanceIdCounter = user.attendanceIdCounter;
        adminConfig = user.adminConfig;
        staffPermissions = user.staffPermissions;
        whatsappTemplates = user.whatsappTemplates;
        appointmentsLastModified = Time.now();
        patientsLastModified = user.patientsLastModified;
        leadsLastModified = user.leadsLastModified;
        staffLastModified = user.staffLastModified;
        profileLastModified = user.profileLastModified;
        prescriptionsLastModified = user.prescriptionsLastModified;
      };

      userData.add(caller, updatedData);
    };

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
            staff = data.staff;
            attendance = data.attendance;
            attendanceIdCounter = data.attendanceIdCounter;
            adminConfig = data.adminConfig;
            staffPermissions = data.staffPermissions;
            whatsappTemplates = data.whatsappTemplates;
            appointmentsLastModified = Time.now();
            patientsLastModified = data.patientsLastModified;
            leadsLastModified = data.leadsLastModified;
            staffLastModified = data.staffLastModified;
            profileLastModified = data.profileLastModified;
            prescriptionsLastModified = data.prescriptionsLastModified;
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
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = Time.now();
              patientsLastModified = data.patientsLastModified;
              leadsLastModified = data.leadsLastModified;
              staffLastModified = data.staffLastModified;
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
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
            staff = data.staff;
            attendance = data.attendance;
            attendanceIdCounter = data.attendanceIdCounter;
            adminConfig = data.adminConfig;
            staffPermissions = data.staffPermissions;
            whatsappTemplates = data.whatsappTemplates;
            appointmentsLastModified = Time.now();
            patientsLastModified = data.patientsLastModified;
            leadsLastModified = data.leadsLastModified;
            staffLastModified = data.staffLastModified;
            profileLastModified = data.profileLastModified;
            prescriptionsLastModified = data.prescriptionsLastModified;
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

  // PATIENT MANAGEMENT
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
      prescriptionHistory = List.empty<Prescription>();
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
      staff = user.staff;
      attendance = user.attendance;
      attendanceIdCounter = user.attendanceIdCounter;
      adminConfig = user.adminConfig;
      staffPermissions = user.staffPermissions;
      whatsappTemplates = user.whatsappTemplates;
      appointmentsLastModified = user.appointmentsLastModified;
      patientsLastModified = currentTime;
      leadsLastModified = user.leadsLastModified;
      staffLastModified = user.staffLastModified;
      profileLastModified = user.profileLastModified;
      prescriptionsLastModified = user.prescriptionsLastModified;
    };

    userData.add(caller, updatedData);
    "Successfully stored patient!";
  };

  public query ({ caller }) func getPatients() : async [PatientView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view patients");
    };

    switch (userData.get(caller)) {
      case (?data) {
        data.patients.values().toArray().map(
          func(patient) {
            {
              image = patient.image;
              name = patient.name;
              mobile = patient.mobile;
              area = patient.area;
              notes = patient.notes;
              prescriptionHistory = patient.prescriptionHistory.toArray();
            };
          }
        );
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
          case (?existingPatient) {
            data.patients.remove(mobile);
            let updatedPatient : Patient = {
              image;
              name;
              mobile = newMobile;
              area;
              notes;
              prescriptionHistory = existingPatient.prescriptionHistory;
            };

            let updatedData : UserData = {
              profile = data.profile;
              hashedPassword = data.hashedPassword;
              appointments = data.appointments;
              appointmentIdCounter = data.appointmentIdCounter;
              patients = data.patients;
              leads = data.leads;
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = data.leadsLastModified;
              staffLastModified = data.staffLastModified;
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
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
              staff = data.staff;
              attendance = data.attendance;
              attendanceIdCounter = data.attendanceIdCounter;
              adminConfig = data.adminConfig;
              staffPermissions = data.staffPermissions;
              whatsappTemplates = data.whatsappTemplates;
              appointmentsLastModified = data.appointmentsLastModified;
              patientsLastModified = Time.now();
              leadsLastModified = data.leadsLastModified;
              staffLastModified = data.staffLastModified;
              profileLastModified = data.profileLastModified;
              prescriptionsLastModified = data.prescriptionsLastModified;
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
};
