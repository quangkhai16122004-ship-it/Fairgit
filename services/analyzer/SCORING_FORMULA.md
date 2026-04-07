# FairGit Scoring Formula (v3)

This document reflects the implementation in `src/scoreByFiles.ts`.

## 1) Consistency (0..30)

- `dayRatio = min(1, activeDays / 30)`
- `weekRatio = min(1, activeWeeks / 13)`
- `commitsPerActiveDay = commitCount / max(1, activeDays)`
- `burstPenalty = 6 if commitsPerActiveDay > 5; 3 if > 3; else 0`

Formula:

`scoreConsistency = clamp(round((0.65 * weekRatio + 0.35 * dayRatio) * 30) - burstPenalty, 0, 30)`

## 2) Impact (0..50)

Raw impact:

- `corePart = 1.05 * ln(1 + coreLines)`
- `testPart = 0.45 * ln(1 + testLines)`
- `docPart = 0.08 * ln(1 + docLines)`
- `otherPart = 0.06 * ln(1 + otherLines)`
- `noisePenalty = 0.30 * ln(1 + noiseLines)`
- `breadthBonus = 0.45 * ln(1 + uniqueCoreFiles)`

`impactRaw = max(0, corePart + testPart + docPart + otherPart + breadthBonus - noisePenalty)`

Population references:

- `impactRef = max(1, P75(impactRaw of all authors))`
- `impactMax = max(1, max(impactRaw of all authors))`

Score mapping:

- If `impactRaw <= impactRef`:
  `scoreImpact = clamp(round((impactRaw / impactRef) * 38), 0, 50)`
- Else:
  `tailRatio = clamp((impactRaw - impactRef) / (impactMax - impactRef), 0, 1)`
  `scoreImpact = clamp(round((0.76 + 0.24 * tailRatio^0.85) * 50), 0, 50)`

Additional caps:

- If `coreTouches == 0`: `scoreImpact <= 12`
- If `coreTouches == 0` and `testTouches == 0`: `scoreImpact <= 6`

## 3) Clean (0..20)

Ratios:

- `meaningfulLines = coreLines + testLines + docLines + otherLines`
- `meaningfulRatio = meaningfulLines / totalLines`
- `tinyRatio = tinyCommitCount / commitCount`
- `noiseRatio = noiseLines / totalLines`
- `tinyBurstDays = count(day where tiny commits >= 3)`

Base clean:

`baseClean = round((0.75 * meaningfulRatio + 0.25 * (1 - tinyRatio)) * 20)`

Spam penalty:

`spamPenalty = clamp(round(noiseRatio * 7 + tinyRatio * 9 + tinyBurstDays * 2 + (tinyCommitCount >= 8 ? 2 : 0)), 0, 16)`

Final:

`scoreClean = clamp(baseClean - spamPenalty, 0, 20)`

## 4) Total score (0..100)

`scoreTotal = clamp(scoreConsistency + scoreImpact + scoreClean, 0, 100)`

## 5) Confidence (0..100)

- `signalFromLines = min(1, ln(1 + totalLines) / ln(1 + 3000))`
- `signalFromDays = min(1, activeDays / 14)`
- `signalFromCommits = min(1, commitCount / 20)`

`scoreConfidence = clamp(round((0.50 * signalFromLines + 0.30 * signalFromDays + 0.20 * signalFromCommits) * 100), 0, 100)`
