// Utility functions for various common tasks.

/**
 * Inserts text at the current cursor position in a textarea and repositions the cursor.
 * @param {HTMLTextAreaElement} textarea - The textarea element.
 * @param {string} textToInsert - The text to insert.
 * @returns {string} The new value of the textarea.
 */
export const insertTextAtCursor = (textarea, textToInsert) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    // Find the position to place the cursor after insertion
    const cursorPosition = (before + textToInsert).lastIndexOf('{') + 1;

    textarea.value = before + textToInsert + after;
    textarea.selectionStart = textarea.selectionEnd = cursorPosition;
    textarea.focus();
    
    // Return the new value to update the state
    return textarea.value;
};

/**
 * Lookup table for GMAT scaled scores based on the sum of section scores.
 * This chart maps a sum of individual section scores to a total scaled score.
 */
export const scoreChart = [
    { sum: 180, totalScore: 205 }, { sum: 181, totalScore: 215 }, { sum: 182, totalScore: 225 },
    { sum: 183, totalScore: 235 }, { sum: 184, totalScore: 245 }, { sum: 185, totalScore: 255 },
    { sum: 186, totalScore: 265 }, { sum: 187, totalScore: 275 }, { sum: 188, totalScore: 285 },
    { sum: 189, totalScore: 295 }, { sum: 190, totalScore: 305 }, { sum: 191, totalScore: 315 },
    { sum: 192, totalScore: 325 }, { sum: 193, totalScore: 335 }, { sum: 194, totalScore: 345 },
    { sum: 195, totalScore: 355 }, { sum: 196, totalScore: 365 }, { sum: 197, totalScore: 375 },
    { sum: 198, totalScore: 385 }, { sum: 199, totalScore: 395 }, { sum: 200, totalScore: 405 },
    { sum: 201, totalScore: 415 }, { sum: 202, totalScore: 425 }, { sum: 203, totalScore: 435 },
    { sum: 204, totalScore: 445 }, { sum: 205, totalScore: 455 }, { sum: 206, totalScore: 465 },
    { sum: 207, totalScore: 475 }, { sum: 208, totalScore: 485 }, { sum: 209, totalScore: 495 },
    { sum: 210, totalScore: 505 }, { sum: 211, totalScore: 515 }, { sum: 212, totalScore: 525 },
    { sum: 213, totalScore: 535 }, { sum: 214, totalScore: 545 }, { sum: 215, totalScore: 555 },
    { sum: 216, totalScore: 565 }, { sum: 217, totalScore: 565 }, { sum: 218, totalScore: 575 },
    { sum: 219, totalScore: 575 }, { sum: 220, totalScore: 585 }, { sum: 221, totalScore: 585 },
    { sum: 222, totalScore: 595 }, { sum: 223, totalScore: 595 }, { sum: 224, totalScore: 605 },
    { sum: 225, totalScore: 605 }, { sum: 226, totalScore: 615 }, { sum: 227, totalScore: 615 },
    { sum: 228, totalScore: 625 }, { sum: 229, totalScore: 625 }, { sum: 230, totalScore: 635 },
    { sum: 231, totalScore: 635 }, { sum: 232, totalScore: 645 }, { sum: 233, totalScore: 645 },
    { sum: 234, totalScore: 655 }, { sum: 235, totalScore: 655 }, { sum: 236, totalScore: 665 },
    { sum: 237, totalScore: 665 }, { sum: 238, totalScore: 675 }, { sum: 239, totalScore: 675 },
    { sum: 240, totalScore: 685 }, { sum: 241, totalScore: 685 }, { sum: 242, totalScore: 695 },
    { sum: 243, totalScore: 695 }, { sum: 244, totalScore: 705 }, { sum: 245, totalScore: 705 },
    { sum: 246, totalScore: 715 }, { sum: 247, totalScore: 715 }, { sum: 248, totalScore: 725 },
    { sum: 249, totalScore: 725 }, { sum: 250, totalScore: 735 }, { sum: 251, totalScore: 735 },
    { sum: 252, totalScore: 745 }, { sum: 253, totalScore: 745 }, { sum: 254, totalScore: 755 },
    { sum: 255, totalScore: 755 }, { sum: 256, totalScore: 765 }, { sum: 257, totalScore: 765 },
    { sum: 258, totalScore: 775 }, { sum: 259, totalScore: 775 }, { sum: 260, totalScore: 785 },
    { sum: 261, totalScore: 785 }, { sum: 262, totalScore: 785 }, { sum: 263, totalScore: 795 },
    { sum: 264, totalScore: 795 }, { sum: 265, totalScore: 795 }, { sum: 266, totalScore: 805 },
    { sum: 267, totalScore: 805 }, { sum: 268, totalScore: 805 }, { sum: 269, totalScore: 805 },
    { sum: 270, totalScore: 805 }
];

/**
 * Calculates the total GMAT scaled score based on individual section scores.
 * Uses the `scoreChart` for lookup and provides fallbacks for out-of-range sums.
 * @param {number} quantScore - The scaled score for the Quantitative section.
 * @param {number} verbalScore - The scaled score for the Verbal section.
 * @param {number} diScore - The scaled score for the Data Insights section.
 * @returns {number} The total GMAT scaled score.
 */
export const calculateTotalScore = (quantScore, verbalScore, diScore) => {
    const sum = Math.round(quantScore) + Math.round(verbalScore) + Math.round(diScore);
    
    // Find the closest entry in the chart
    const scoreEntry = scoreChart.find(entry => entry.sum === sum);
    
    if (scoreEntry) {
        return scoreEntry.totalScore;
    }
    
    // Fallback for scores outside the chart range
    if (sum < 180) return 205;
    if (sum > 270) return 805;
    
    // If the exact sum is not found, find the nearest one (simple interpolation)
    let closest = scoreChart.reduce((prev, curr) => {
        return (Math.abs(curr.sum - sum) < Math.abs(prev.sum - sum) ? curr : prev);
    });
    return closest.totalScore;
};