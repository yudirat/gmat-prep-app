/**
 * This Cloud Function automatically sets a custom user claim for 'role'
 * whenever a user's document is created or updated in Firestore.
 */

// Import the necessary Firebase modules
const admin = require("firebase-admin");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Triggered on writes to any user document in the specified path.
 * It reads the 'role' from the Firestore document and sets it as a custom
 * claim on the user's authentication token.
 */
exports.setUserRole = onDocumentWritten(
    {
      document: "/artifacts/{appId}/users/{userId}",
      region: "asia-south2",
    },
    async (event) => {
      // When a document is deleted, there's nothing to do.
      if (!event.data.after.exists) {
        return;
      }

      const userData = event.data.after.data();
      const userId = event.params.userId;

      // Get the role before the change to compare.
      const roleBefore = event.data.before.exists ?
        event.data.before.data().role :
        null;

      // Only set the custom claim if the role exists and has changed.
      if (userData && userData.role && userData.role !== roleBefore) {
        try {
          await admin.auth().setCustomUserClaims(userId, {role: userData.role});
          console.log(`Custom claim set for user ${userId}: ${userData.role}`);
        } catch (error) {
          console.error("Error setting custom claims:", error);
        }
      }
    });
