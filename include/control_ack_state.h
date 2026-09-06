#pragma once

#include <stddef.h>
#include <stdio.h>
#include <string.h>

// ACK ima ločeno čakajoče in oddano stanje. Tako pozen SSE dogodek ne more
// ponovno poslati potrditve, ki jo je Firebase že potrdil.
template <size_t RequestIdLength, size_t ResultIdLength>
class ControlAcknowledgementState {
 public:
  bool schedule(const char *requestId, const char *resultId) {
    if (!isValid(requestId, RequestIdLength) || !isValid(resultId, ResultIdLength)) return false;
    if (wasCompleted(requestId) || same(requestId, pendingRequestId_) ||
        same(requestId, inFlightRequestId_)) return true;
    copy(pendingRequestId_, requestId, RequestIdLength);
    copy(pendingResultId_, resultId, ResultIdLength);
    pending_ = true;
    return true;
  }

  bool begin(char *requestId, char *resultId) {
    if (!pending_ || inFlight_) return false;
    copy(inFlightRequestId_, pendingRequestId_, RequestIdLength);
    copy(inFlightResultId_, pendingResultId_, ResultIdLength);
    pending_ = false;
    inFlight_ = true;
    copy(requestId, inFlightRequestId_, RequestIdLength);
    copy(resultId, inFlightResultId_, ResultIdLength);
    return true;
  }

  bool complete(const char *resultId) {
    if (!inFlight_ || !same(resultId, inFlightResultId_)) return false;
    copy(lastCompletedRequestId_, inFlightRequestId_, RequestIdLength);
    clear(inFlightRequestId_);
    clear(inFlightResultId_);
    inFlight_ = false;
    return true;
  }

  bool fail(const char *resultId) {
    if (!inFlight_ || !same(resultId, inFlightResultId_)) return false;
    // Nov ukaz ima prednost. Stari ACK ne sme prepisati njegovega čakanja.
    if (!pending_) {
      copy(pendingRequestId_, inFlightRequestId_, RequestIdLength);
      copy(pendingResultId_, inFlightResultId_, ResultIdLength);
      pending_ = true;
    }
    clear(inFlightRequestId_);
    clear(inFlightResultId_);
    inFlight_ = false;
    return true;
  }

  bool hasPending() const { return pending_; }
  bool hasInFlight() const { return inFlight_; }
  bool wasCompleted(const char *requestId) const { return same(requestId, lastCompletedRequestId_); }

 private:
  static bool isValid(const char *value, size_t capacity) {
    return value != nullptr && value[0] != '\0' && strlen(value) < capacity;
  }
  static bool same(const char *first, const char *second) {
    return first != nullptr && first[0] != '\0' && strcmp(first, second) == 0;
  }
  static void copy(char *destination, const char *source, size_t capacity) {
    snprintf(destination, capacity, "%s", source == nullptr ? "" : source);
  }
  static void clear(char *value) { value[0] = '\0'; }

  char pendingRequestId_[RequestIdLength]{};
  char pendingResultId_[ResultIdLength]{};
  char inFlightRequestId_[RequestIdLength]{};
  char inFlightResultId_[ResultIdLength]{};
  char lastCompletedRequestId_[RequestIdLength]{};
  bool pending_ = false;
  bool inFlight_ = false;
};
