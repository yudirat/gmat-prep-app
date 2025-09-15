const admin = require("firebase-admin");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onCall} = require("firebase-functions/v2/https");

// Initialize the Firebase Admin SDK
admin.initializeApp();

exports.createUser = onCall(async (request) => {
  // 1. Expect the client to send the `appId` along with user details.
  const {email, password, displayName, appId} = request.data;

  if (!appId) {
    throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with an "appId" to create a user correctly.'
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });

    // 2. Save the user document to the correct path that your trigger is watching.
    const userDocPath = `artifacts/${appId}/users/${userRecord.uid}`;
    await admin.firestore().doc(userDocPath).set({
      email: email,
      displayName: displayName,
      role: 'student', // Default role for new users
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

      if (!snapshot.exists) {
        console.log(`User document ${userId} deleted. No action taken.`);
        return;
      }

      const userData = snapshot.data();

      const previousData = event.data.before.exists ? event.data.before.data() : {};
      if (previousData.role === userData.role) {
        console.log(`Role for user ${userId} is unchanged. No action taken.`);
        return;
      }

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
