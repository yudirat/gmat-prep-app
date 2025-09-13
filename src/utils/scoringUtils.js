// src/utils/scoringUtils.js

/**
 * Converts a weighted accuracy percentage into an estimated
 * GMAT Focus Edition scaled score for a single section (60-90).
 * @param {number} accuracy - The weighted accuracy (0-100).
 * @returns {number} - The estimated scaled score.
 */
export const getSectionScaledScore = (accuracy) => {
  if (accuracy >= 95) return 90;
  if (accuracy >= 90) return 89;
  if (accuracy >= 85) return 87;
  if (accuracy >= 80) return 85;
  if (accuracy >= 75) return 83;
  if (accuracy >= 70) return 81;
  if (accuracy >= 60) return 79;
  if (accuracy >= 50) return 77;
  if (accuracy >= 40) return 74;
  if (accuracy >= 30) return 71;
  if (accuracy >= 20) return 67;
  if (accuracy >= 10) return 64;
  return 60;
};

/**
 * Converts three section scaled scores into an estimated
 * GMAT Focus Edition total scaled score (205-805).
 * Note: This is a simplified model. The official algorithm is proprietary.
 * This model averages the percentile equivalents for a reasonable estimate.
 * @param {number} quantScore - Scaled score for Quantitative section.
 * @param {number} verbalScore - Scaled score for Verbal section.
 * @param {number} dataInsightsScore - Scaled score for Data Insights section.
 * @returns {number} - The estimated total scaled score.
 */
export const getTotalScaledScore = (quantScore, verbalScore, dataInsightsScore) => {
    // A simplified lookup table based on approximate total scores for balanced section scores.
    const scoreMap = {
        90: 785, 89: 765, 88: 745, 87: 725, 86: 715, 85: 705,
        84: 695, 83: 685, 82: 675, 81: 665, 80: 655, 79: 645,
        78: 635, 77: 625, 76: 615, 75: 605, 74: 595, 73: 585,
        72: 575, 71: 565, 70: 555, 69: 545, 68: 535, 67: 525,
        66: 515, 65: 505, 64: 495, 63: 485, 62: 475, 61: 465, 60: 455
    };
    
    // Average the three section scores and find the closest match in our map
    const avgSectionScore = Math.round((quantScore + verbalScore + dataInsightsScore) / 3);

    // Find the closest score in our map
    let closestScore = 455;
    for (const score in scoreMap) {
        if (avgSectionScore >= parseInt(score)) {
            closestScore = scoreMap[score];
        } else {
            break; // Stop when we've passed the average
        }
    }
    
    // Ensure the final score ends in a '5' as per GMAT Focus Edition rules
    return closestScore;
};