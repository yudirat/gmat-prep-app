const admin = require("firebase-admin");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onCall} = require("firebase-functions/v2/https");

// Initialize the Firebase Admin SDK
admin.initializeApp();

exports.createUser = onCall(async (request) => {
  const {email, password, displayName} = request.data;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });

    // Create a user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName,
      role: 'student', // or any default role
    });

    return {uid: userRecord.uid};
  } catch (error) {
    console.error('Error creating new user:', error);
    throw new functions.https.HttpsError(
        'internal',
        'Unable to create new user.',
        error,
    );
  }
});

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
      const snapshot = event.data.after;
      const userId = event.params.userId;

      // When a document is deleted, there's nothing to do.
      if (!snapshot.exists) {
        console.log(`User document ${userId} deleted. No action taken.`);
        return;
      }

      const userData = snapshot.data();

      // Check if the role has actually changed to avoid unnecessary updates.
      const previousData = event.data.before.data();
      if (event.data.before.exists && previousData.role === userData.role) {
        console.log(`Role for user ${userId} is unchanged. No action taken.`);
        return;
      }

      // Set the custom claim if the role exists.
      if (userData && userData.role) {
        try {
          await admin.auth().setCustomUserClaims(userId, {role: userData.role});
          console.log(`Custom claim set for user ${userId}: ${userData.role}`);
        } catch (error) {
          console.error(`Error setting custom claim for user ${userId}:`, error);
        }
      } else {
        console.log(`User ${userId} data does not have a role. No action taken.`);
      }
    },
);