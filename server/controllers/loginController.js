import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const verifyUser = async (req, res) => {
  try {
    const firebaseUser = req.user;

    let user = await User.findOne({
      firebaseUid: firebaseUser.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.name || firebaseUser.displayName || "User",
        email: firebaseUser.email,
        photoURL: firebaseUser.picture || "",
        provider: firebaseUser.firebase.sign_in_provider,
        emailVerified: firebaseUser.email_verified,
      });
    } else {
      user.lastLogin = new Date();

      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
    success: true,
    token,
    user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};