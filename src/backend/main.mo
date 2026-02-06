import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type Message = {
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    isPublic : Bool;
  };

  module Message {
    public func compareByTimestamp(m1 : Message, m2 : Message) : Order.Order {
      Int.compare(m1.timestamp, m2.timestamp);
    };
  };

  type FaqEntry = {
    question : Text;
    answer : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // Persistent data structures
  let publicMessages = List.empty<Message>();
  let userMessages = Map.empty<Principal, List.List<Message>>();
  let faqEntries = Map.empty<Text, FaqEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let lastPublicFetchTimestamps = Map.empty<Principal, Time.Time>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Message Storage
  public shared ({ caller }) func sendMessage(content : Text, isPublic : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };

    let message : Message = {
      author = caller;
      content;
      timestamp = Time.now();
      isPublic;
    };

    if (isPublic) {
      publicMessages.add(message);
    } else {
      let userMsgs = switch (userMessages.get(caller)) {
        case (null) { List.empty<Message>() };
        case (?existing) { existing };
      };
      userMsgs.add(message);
      userMessages.add(caller, userMsgs);
    };
  };

  public query ({ caller }) func getPrivateMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access private messages");
    };
    switch (userMessages.get(caller)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };

  public query func getPublicMessages() : async [Message] {
    publicMessages.toArray().reverse();
  };

  // Efficiently fetch new public messages since last fetch
  // Public messages are accessible to all users including guests
  public shared ({ caller }) func getNewPublicMessages() : async [Message] {
    let lastFetch = switch (lastPublicFetchTimestamps.get(caller)) {
      case (null) { 0 };
      case (?timestamp) { timestamp };
    };
    
    let newMessages = publicMessages.toArray().filter(
      func(msg) {
        msg.timestamp > lastFetch;
      }
    );
    
    if (newMessages.size() > 0) {
      lastPublicFetchTimestamps.add(caller, Time.now());
    };
    
    newMessages;
  };

  // FAQ Management
  public shared ({ caller }) func addFaqEntry(question : Text, answer : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) { 
      Runtime.trap("Unauthorized: Only admin can add FAQ.") 
    };
    let entry : FaqEntry = { question; answer };
    faqEntries.add(question, entry);
  };

  public query func findFaqMatch(question : Text) : async ?FaqEntry {
    faqEntries.get(question);
  };

  // Analytics
  public query ({ caller }) func getChatStats() : async (Nat, Nat, Nat) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view chat statistics");
    };
    let publicCount = publicMessages.size();
    let privateCount = userMessages.size();
    let faqCount = faqEntries.size();
    (publicCount, privateCount, faqCount);
  };

  // New: Search FAQs by keyword
  public query func searchFaqsByKeyword(keyword : Text) : async [FaqEntry] {
    let results = List.empty<FaqEntry>();
    for ((_, entry) in faqEntries.entries()) {
      if (entry.question.contains(#text keyword) or entry.answer.contains(#text keyword)) {
        results.add(entry);
      };
    };
    results.toArray();
  };
};
