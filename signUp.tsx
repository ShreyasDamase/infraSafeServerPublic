// import {
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import React, { useEffect, useRef, useState } from "react";
// import { getApp } from "@react-native-firebase/app";
// import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
// import { BASE_URL } from "@/service/config";

// const OtpScreen = () => {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [confirm, setConfirm] =
//     useState<FirebaseAuthTypes.ConfirmationResult>();
//   const [code, setCode] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [user, setuser] = useState<FirebaseAuthTypes.User | undefined | null>();

//   const [seconds, setSeconds] = useState(60);
//   const intervalRef = useRef<NodeJS.Timer | null>(null);

//   useEffect(() => {
//     if (confirm) {
//       setSeconds(60); // Reset timer
//       intervalRef.current = setInterval(() => {
//         setSeconds((prev) => {
//           if (prev === 1 && intervalRef.current) {
//             clearInterval(intervalRef.current);
//             intervalRef.current = null;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [confirm]);

//   const signInWithPhoneNumber = async () => {
//     if (!phoneNumber || phoneNumber.length < 10) {
//       Alert.alert("Error", "Please enter a valid phone number");
//       return;
//     }

//     setLoading(true);
//     try {
//       const formattedNumber = `+91${phoneNumber}`;
//       const confirmation = await auth().signInWithPhoneNumber(formattedNumber);
//       setConfirm(confirmation);
//       console.log("confirem,ation", confirmation);
//       Alert.alert("Success", "OTP sent successfully");
//     } catch (error: any) {
//       console.log("Error in sending code:", error);
//       Alert.alert("Error", error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const confirmCode = async () => {
//     if (!code || code.length < 6) {
//       Alert.alert("Error", "Please enter a valid OTP");
//       return;
//     }

//     setLoading(true);

//     try {
//       const userCredential = await confirm.confirm(code);
//       const user = userCredential.user;

//       //   setuser(userCredential.user);
//       const idToken = await user.getIdToken();
//       console.log("idtoken:", idToken);
//       const response = await fetch(`${BASE_URL}/verify-token`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ token: idToken }),
//       });

//       const result = await response.json();
//       console.log(
//         "User       const userCredential = await confirm.confirm(code):",
//         user
//       );
//       if (!result.success) {
//         throw new Error(result.error || "Verification by backend failed");
//       }

//       console.log("Verified user:", result.phoneNumber);
//       Alert.alert("Success", "You're now verified!");
//       console.log("User userCredential.user:", user);
//       // Navigate to your home screen here
//     } catch (error) {
//       console.log("Error in confirming code:", error);
//       Alert.alert("Error", "Invalid OTP or code expired");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {!confirm ? (
//         <>
//           <Text style={styles.label}>Enter Phone Number</Text>
//           <TextInput
//             style={styles.input}
//             value={phoneNumber}
//             onChangeText={setPhoneNumber}
//             keyboardType="phone-pad"
//             maxLength={10}
//             placeholder="1234567890"
//           />

//           <TouchableOpacity
//             style={styles.button}
//             onPress={signInWithPhoneNumber}
//             disabled={loading}
//           >
//             <Text style={styles.buttonText}>
//               {loading ? "Sending..." : "Send OTP"}
//             </Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <>
//           <Text style={[styles.label, { marginTop: 10 }]}>Enter OTP</Text>
//           <TextInput
//             style={styles.input}
//             value={code}
//             onChangeText={setCode}
//             keyboardType="number-pad"
//             maxLength={6}
//             placeholder="123456"
//           />
//           {seconds > 0 ? (
//             <TouchableOpacity
//               style={styles.button}
//               onPress={confirmCode}
//               disabled={loading}
//             >
//               <Text style={styles.buttonText}>
//                 {loading ? "Verifying..." : `Verify OTP (${seconds}s)`}
//               </Text>
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: "#28A745" }]}
//               onPress={signInWithPhoneNumber}
//             >
//               <Text style={styles.buttonText}>Resend OTP</Text>
//             </TouchableOpacity>
//           )}
//         </>
//       )}
//     </View>
//   );
// };

// export default OtpScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 24,
//     justifyContent: "center",
//     backgroundColor: "#fff",
//   },
//   label: {
//     fontSize: 20,
//     marginBottom: 12,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#aaa",
//     borderRadius: 10,
//     padding: 12,
//     fontSize: 18,
//     textAlign: "center",
//     marginBottom: 24,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 14,
//     borderRadius: 10,
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "600",
//     textAlign: "center",
//     fontSize: 18,
//   },
// });
// src/theme/color-table.ts

/**
 * COLOR SCHEME COMPARISON TABLE
 * Light and Dark theme colors organized in a side-by-side table format
 */

export const ColorTable = {
  // ==================== CORE COLORS ====================
  core: [
    { name: "Primary", light: "#4D9BFF", dark: "#99C7FF" },
    { name: "Secondary", light: "#94A3B8", dark: "#E2E8F0" },
    { name: "Background", light: "#F8FAFC", dark: "#1E293B" },
    { name: "Surface", light: "#F8FAFC", dark: "#475569" },
  ],

  // ==================== TEXT COLORS ====================
  text: [
    { name: "Primary", light: "#1E293B", dark: "#F8FAFC" },
    { name: "Secondary", light: "#475569", dark: "#E2E8F0" },
    { name: "Tertiary", light: "#94A3B8", dark: "#94A3B8" },
    { name: "Disabled", light: "#E2E8F0", dark: "#475569" },
    { name: "Inverted", light: "#F8FAFC", dark: "#1E293B" },
    { name: "Link", light: "#4D9BFF", dark: "#99C7FF" },
  ],

  // ==================== STATUS COLORS ====================
  status: [
    { name: "Active", light: "#4D9BFF", dark: "#99C7FF" },
    { name: "Pending", light: "#F59E0B", dark: "#FCD34D" },
    { name: "Resolved", light: "#38B2AC", dark: "#81E6D9" },
    { name: "Cancelled", light: "#94A3B8", dark: "#94A3B8" },
    { name: "Critical", light: "#F44336", dark: "#FF9C8E" },
  ],

  // ==================== FEEDBACK COLORS ====================
  feedback: [
    { name: "Success BG", light: "#E6FFFA", dark: "#234E52" },
    { name: "Warning BG", light: "#FFFBEB", dark: "#78350F" },
    { name: "Error BG", light: "#FFEDEA", dark: "#8E0000" },
    { name: "Info BG", light: "#E6F2FF", dark: "#002966" },
  ],

  // ==================== COMPLAINT COLORS ====================
  complaints: [
    { name: "Water", light: "#06B6D4", dark: "#67E8F9" },
    { name: "Fire", light: "#F44336", dark: "#FF9C8E" },
    { name: "Electric", light: "#F59E0B", dark: "#FCD34D" },
    { name: "Road", light: "#475569", dark: "#94A3B8" },
    { name: "Gas", light: "#DB2777", dark: "#F472B6" },
    { name: "Medical", light: "#7C3AED", dark: "#C4B5FD" },
    { name: "Structural", light: "#84CC16", dark: "#D9F99D" },
  ],

  // ==================== BUTTON COLORS ====================
  buttons: [
    { name: "Primary BG", light: "#4D9BFF", dark: "#99C7FF" },
    { name: "Primary Text", light: "#F8FAFC", dark: "#1E293B" },
    { name: "Secondary BG", light: "#E2E8F0", dark: "#475569" },
    { name: "Secondary Text", light: "#1E293B", dark: "#F8FAFC" },
    { name: "Danger BG", light: "#F44336", dark: "#FF9C8E" },
    { name: "Danger Text", light: "#F8FAFC", dark: "#1E293B" },
  ],

  // ==================== FORM COLORS ====================
  forms: [
    { name: "Input BG", light: "#F8FAFC", dark: "#475569" },
    { name: "Input Border", light: "#E2E8F0", dark: "#94A3B8" },
    { name: "Input Text", light: "#1E293B", dark: "#F8FAFC" },
    { name: "Checkbox", light: "#4D9BFF", dark: "#99C7FF" },
    { name: "Switch", light: "#4D9BFF", dark: "#99C7FF" },
  ],

  // ==================== NAVIGATION COLORS ====================
  navigation: [
    { name: "Header BG", light: "#F8FAFC", dark: "#1E293B" },
    { name: "Header Text", light: "#1E293B", dark: "#F8FAFC" },
    { name: "Tab Active", light: "#4D9BFF", dark: "#99C7FF" },
    { name: "Tab Inactive", light: "#94A3B8", dark: "#94A3B8" },
  ],
};
