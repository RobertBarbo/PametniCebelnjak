#pragma once

#include <stdint.h>

enum class SampleProgress { Pending, Complete, Timeout };

// V enem prehodu zanke preberemo največ en že pripravljen ADC vzorec.
// Reader mora biti neblokirajoč: false pomeni, da vzorec še ni na voljo.
class LoadCellSampleWindow {
 public:
  void begin(uint32_t now, uint8_t samples) {
    lastProgressMillis_ = now;
    remaining_ = samples;
    sampleCount_ = samples;
    sum_ = 0;
  }

  template <typename Reader>
  SampleProgress poll(uint32_t now, uint32_t timeoutMs, Reader reader, int32_t &average) {
    if (remaining_ == 0) return SampleProgress::Timeout;
    int32_t sample = 0;
    if (reader(sample)) {
      sum_ += sample;
      lastProgressMillis_ = now;
      if (--remaining_ == 0) {
        average = static_cast<int32_t>(sum_ / sampleCount_);
        return SampleProgress::Complete;
      }
    } else if (uint32_t(now - lastProgressMillis_) >= timeoutMs) {
      remaining_ = 0;
      return SampleProgress::Timeout;
    }
    return SampleProgress::Pending;
  }

 private:
  uint32_t lastProgressMillis_ = 0;
  uint8_t remaining_ = 0;
  uint8_t sampleCount_ = 0;
  int64_t sum_ = 0;
};
