import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Array "mo:core/Array";
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

  type MamaFeedbackMetadata = {
    category : Text;
    explanation : Text;
    userPrompt : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  type AnonymizedSignal = {
    category : Text;
    normalizedScore : Float;
    timestamp : Time.Time;
  };

  // Persistent data structures
  let publicMessages = List.empty<Message>();
  let userMessages = Map.empty<Principal, List.List<Message>>();
  let faqEntries = Map.empty<Text, FaqEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let feedbackMetadata = Map.empty<Principal, MamaFeedbackMetadata>();
  let lastPublicFetchTimestamps = Map.empty<Principal, Time.Time>();

  // Privacy-preserving learning (PPP)
  let pppOptIn = Map.empty<Principal, Bool>();
  let anonymizedSignals = Map.empty<Text, List.List<AnonymizedSignal>>();

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
  public shared ({ caller }) func getNewPublicMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can use timestamp tracking");
    };

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
      Runtime.trap("Unauthorized: Only admin can add FAQ.");
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

  // Store structured metadata for Mama feedback
  public shared ({ caller }) func saveFeedbackMetadata(metadata : MamaFeedbackMetadata) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save feedback metadata");
    };
    feedbackMetadata.add(caller, metadata);
  };

  public query ({ caller }) func getFeedbackMetadata() : async ?MamaFeedbackMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access feedback metadata");
    };
    feedbackMetadata.get(caller);
  };

  public shared ({ caller }) func clearFeedbackMetadata() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can clear feedback metadata");
    };
    feedbackMetadata.remove(caller);
  };

  // PPP Opt-In/Out
  public shared ({ caller }) func setPppOptIn(optIn : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can change ppp opt-in status");
    };
    pppOptIn.add(caller, optIn);
  };

  public query ({ caller }) func getPppOptIn() : async Bool {
    switch (pppOptIn.get(caller)) {
      case (?optIn) { optIn };
      case (null) { false };
    };
  };

  // Store anonymized public signals
  public shared ({ caller }) func storeAnonymizedSignal(category : Text, normalizedScore : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can store ppp signals");
    };

    let newSignal : AnonymizedSignal = {
      category;
      normalizedScore;
      timestamp = Time.now();
    };

    let existingSignals = switch (anonymizedSignals.get(category)) {
      case (null) { List.empty<AnonymizedSignal>() };
      case (?signals) { signals };
    };

    existingSignals.add(newSignal);
    anonymizedSignals.add(category, existingSignals);
  };

  // Get category statistics
  public query func getCategoryStats(category : Text) : async ?{
    averageScore : Float;
    count : Nat;
    recentTimestamps : [Time.Time];
  } {
    switch (anonymizedSignals.get(category)) {
      case (null) { null };
      case (?signals) {
        let nonZeroCount = signals.toArray().filter(
          func(signal) { signal.normalizedScore > 0 }
        ).size();

        if (nonZeroCount == 0) { return null };

        let totalScore = signals.toArray().foldLeft(
          0.0,
          func(acc, signal) {
            acc + signal.normalizedScore;
          },
        );

        let recentSignals = signals.toArray().filter(
          func(signal) {
            Time.now() - signal.timestamp < 30_000_000_000;
          }
        );

        ?{
          averageScore = totalScore / nonZeroCount.toFloat();
          count = nonZeroCount;
          recentTimestamps = recentSignals.map(func(signal) { signal.timestamp });
        };
      };
    };
  };

  // Query overall stats by category
  public query func getAllCategoryStats() : async [(Text, Float, Nat)] {
    let results = List.empty<(Text, Float, Nat)>();

    for ((category, signals) in anonymizedSignals.entries()) {
      let nonZeroCount = signals.toArray().filter(
        func(signal) { signal.normalizedScore > 0 }
      ).size();

      if (nonZeroCount > 0) {
        let totalScore = signals.toArray().foldLeft(
          0.0,
          func(acc, signal) {
            acc + signal.normalizedScore;
          },
        );

        results.add((
          category,
          totalScore / nonZeroCount.toFloat(),
          nonZeroCount,
        ));
      };
    };
    results.toArray();
  };

  public query ({ caller }) func getAllCategoryTotalsByUser() : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch ppp data");
    };

    let totals = List.empty<(Text, Float)>();

    for ((category, signals) in anonymizedSignals.entries()) {
      let filteredSignals = signals.toArray().filter(
        func(signal) { signal.normalizedScore > 0 }
      );

      if (filteredSignals.size() > 0) {
        let sum = filteredSignals.foldLeft(
          0.0,
          func(acc, signal) {
            acc + signal.normalizedScore;
          },
        );
        totals.add((category, sum));
      };
    };
    totals.toArray();
  };
};
