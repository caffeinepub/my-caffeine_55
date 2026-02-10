import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Bool "mo:core/Bool";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Error "mo:core/Error";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import Principal "mo:core/Principal";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  // Types
  type MessageId = Nat;
  type Message = {
    id : MessageId;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    isPublic : Bool;
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

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let publicMessages = List.empty<Message>();
  let userMessages = Map.empty<Principal, List.List<Message>>();
  let faqEntries = Map.empty<Text, FaqEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let feedbackMetadata = Map.empty<Principal, MamaFeedbackMetadata>();
  let lastPublicFetchTimestamps = Map.empty<Principal, Time.Time>();
  let perUserVarietySeed = Map.empty<Principal, Nat>();

  // FAQ Suggestion Types and State
  public type FaqSuggestion = {
    suggestedQuestion : Text;
    sourceMessageId : MessageId;
    sourceAuthor : Principal;
    sourceContent : Text;
    createdAt : Time.Time;
  };

  public type SuggestionStatus = {
    #pending;
    #ignored;
    #promoted;
  };

  var nextMessageId : MessageId = 1;
  let faqSuggestions = Map.empty<Text, FaqSuggestion>();
  let suggestionStatuses = Map.empty<Text, SuggestionStatus>();
  let anonymizedSignals = Map.empty<Text, List.List<AnonymizedSignal>>();

  // User Profile Management (AUTH-gating)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
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

  // Helper function to automatically store anonymized learning signal
  private func storeAutomaticLearningSignal(content : Text, _caller : Principal) {
    // Extract a simple category based on message length as a basic anonymization
    let category = if (content.size() < 50) {
      "short_message";
    } else if (content.size() < 200) {
      "medium_message";
    } else {
      "long_message";
    };

    // Normalize score based on content characteristics (anonymized)
    let normalizedScore = Float.min(1.0, content.size().toFloat() / 500.0);

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

  // Message Storage (AUTH-gating with automatic learning)
  public shared ({ caller }) func sendMessage(content : Text, isPublic : Bool) : async MessageId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };

    let messageId = nextMessageId;
    let message : Message = {
      id = messageId;
      author = caller;
      content;
      timestamp = Time.now();
      isPublic;
    };

    if (isPublic) {
      publicMessages.add(message);
    } else {
      // For private messages, automatically store anonymized learning signal
      storeAutomaticLearningSignal(content, caller);

      let userMsgs = switch (userMessages.get(caller)) {
        case (null) { List.empty<Message>() };
        case (?existing) { existing };
      };
      userMsgs.add(message);
      userMessages.add(caller, userMsgs);
    };

    nextMessageId += 1;
    messageId;
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

  // FAQ Management (AUTH-gating)
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

  // Analytics (AUTH-gating)
  public query ({ caller }) func getChatStats() : async (Nat, Nat, Nat) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view chat statistics");
    };
    let publicCount = publicMessages.size();
    let privateCount = userMessages.size();
    let faqCount = faqEntries.size();
    (publicCount, privateCount, faqCount);
  };

  // Public access to transparency statistics (NO authentication)
  public query func getPubliclyAccessibleStats() : async {
    totalPublicMessages : Nat;
    totalPrivateMessages : Nat;
    totalFaqEntries : Nat;
  } {
    var totalPrivateCount = 0;
    for ((_, msgList) in userMessages.entries()) {
      totalPrivateCount += msgList.size();
    };
    {
      totalPublicMessages = publicMessages.size();
      totalPrivateMessages = totalPrivateCount;
      totalFaqEntries = faqEntries.size();
    };
  };

  // Search FAQs by keyword (NO authentication)
  public query func searchFaqsByKeyword(keyword : Text) : async [FaqEntry] {
    let results = List.empty<FaqEntry>();
    for ((_, entry) in faqEntries.entries()) {
      if (entry.question.contains(#text keyword) or entry.answer.contains(#text keyword)) {
        results.add(entry);
      };
    };
    results.toArray();
  };

  // Store structured metadata for Mama feedback (AUTH-gating)
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

  // Store anonymized public signals (AUTH-gating)
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

  // Get category statistics (AUTH-gating - privacy-preserving learning data)
  public query ({ caller }) func getCategoryStats(category : Text) : async ?{
    averageScore : Float;
    count : Nat;
    recentTimestamps : [Time.Time];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access learning statistics");
    };

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

  // Query overall stats by category (AUTH-gating - privacy-preserving learning data)
  public query ({ caller }) func getAllCategoryStats() : async [(Text, Float, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access learning statistics");
    };

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

  // New function to store personalized variety seed (AUTH-gating)
  public shared ({ caller }) func setPersonalizedVarietySeed(seed : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can set variety seed");
    };
    perUserVarietySeed.add(caller, seed);
  };

  // Helper function to calculate stable text hash
  func stableTextHash(text : Text) : Nat32 {
    let fnvPrime32 : Nat32 = 16777619;
    let fnvOffset32 : Nat32 = 2166136261;

    var hash = fnvOffset32;

    for (char in text.chars()) {
      let codePoint = char.toNat32();
      hash := hash ^ codePoint;
      hash := hash * fnvPrime32;
      hash := hash & 0xFFFFFFFF;
    };

    hash;
  };

  // Deterministic aggregate variety seed function (AUTH-gating - privacy-preserving learning data)
  public query ({ caller }) func calculateVarietySeed() : async (Nat, Bool) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can calculate variety seed");
    };

    if (anonymizedSignals.isEmpty()) { return (0, false) };

    var totalHash : Nat = 0;
    var totalNormalizedSum : Nat = 0;
    var nonZeroCategoryCount = 0;

    for ((category, signals) in anonymizedSignals.entries()) {
      let filteredSignals = signals.toArray().filter(
        func(signal) { signal.normalizedScore > 0 }
      );

      if (filteredSignals.size() > 0) {
        nonZeroCategoryCount += 1;

        let sum = filteredSignals.foldLeft(
          0.0,
          func(acc, signal) {
            acc + signal.normalizedScore;
          },
        );

        // Only use first 3 digits for deterministic variations
        var truncatedSum = (sum * 1000).toInt();
        if (truncatedSum < 0) { truncatedSum *= -1 };
        if (truncatedSum > 10_000) {
          truncatedSum := truncatedSum % 10_000;
        };

        let categoryHash = stableTextHash(category).toNat() % 997;

        totalHash += (categoryHash + truncatedSum).toNat();
        totalNormalizedSum += truncatedSum.toNat();
      };
    };

    if (nonZeroCategoryCount == 0) { return (0, false) };

    let varietySeed : Nat = (totalHash + totalNormalizedSum + (nonZeroCategoryCount * 71)) % 347_000_011;
    (varietySeed % 47_391, true);
  };

  // Query personalized variety seed (AUTH-gating)
  public query ({ caller }) func getPersonalizedVarietySeed() : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get variety seed");
    };
    perUserVarietySeed.get(caller);
  };

  // Legacy compatibility: Return aggregate variety seed if not personalized (AUTH-gating)
  public query ({ caller }) func getVarietySeedWithFallback() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get fallback variety seed");
    };

    switch (perUserVarietySeed.get(caller)) {
      case (?seed) { seed };
      case (null) {
        var nonZeroCategoryCount = 0;

        for ((_, signals) in anonymizedSignals.entries()) {
          let filteredSignals = signals.toArray().filter(
            func(signal) { signal.normalizedScore > 0 }
          );

          if (filteredSignals.size() > 0) {
            nonZeroCategoryCount += 1;
          };
        };

        if (nonZeroCategoryCount == 0) { return 0 };

        var totalHash : Nat = 0;
        var totalNormalizedSum : Nat = 0;
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

            // Only use first 3 digits for deterministic variations
            var truncatedSum = (sum * 1000).toInt();
            if (truncatedSum < 0) { truncatedSum *= -1 };
            if (truncatedSum > 10_000) {
              truncatedSum := truncatedSum % 10_000;
            };

            let categoryHash = stableTextHash(category).toNat() % 997;
            totalHash += (categoryHash + truncatedSum).toNat();
            totalNormalizedSum += truncatedSum.toNat();
          };
        };

        let varietySeed : Nat = (totalHash + totalNormalizedSum + (nonZeroCategoryCount * 71)) % 347_000_011;
        return varietySeed % 47391;
      };
    };
  };

  public query ({ caller }) func hasPersonalizedVarietySeed() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check variety seed");
    };
    switch (perUserVarietySeed.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func resetPersonalizedVarietySeed() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can reset variety seed");
    };
    perUserVarietySeed.remove(caller);
  };

  // FAQ Suggestion Module Functions (AUTH-gating)
  public query ({ caller }) func getPendingFaqSuggestions() : async [FaqSuggestion] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view FAQ suggestions.");
    };
    let pending = List.empty<FaqSuggestion>();
    for ((_, suggestion) in faqSuggestions.entries()) {
      switch (suggestionStatuses.get(suggestion.suggestedQuestion)) {
        case (?status) {
          switch (status) {
            case (#pending) { pending.add(suggestion) };
            case (_) {};
          };
        };
        case (null) {};
      };
    };
    pending.toArray();
  };

  public shared ({ caller }) func ignoreFaqSuggestion(question : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can ignore suggestions.");
    };
    suggestionStatuses.add(question, #ignored);
  };

  public shared ({ caller }) func promoteFaqSuggestion(question : Text, answer : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can promote suggestions.");
    };

    switch (faqSuggestions.get(question)) {
      case (null) { Runtime.trap("Suggestion not found") };
      case (?_) {
        let entry : FaqEntry = { question; answer };
        faqEntries.add(question, entry);
        suggestionStatuses.add(question, #promoted);
      };
    };
  };
};

