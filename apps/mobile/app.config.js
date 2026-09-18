/**
 * app.json plus the one piece that depends on the environment: Google
 * sign-in's iOS URL scheme, which is the iOS OAuth client ID reversed.
 * With no iOS client ID the plugin is left out and the button hides itself
 * (src/components/SocialSignIn.tsx); Android needs no plugin options.
 */
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const suffix = ".apps.googleusercontent.com";
  if (!iosClientId.endsWith(suffix)) return config;
  const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`;
  return {
    ...config,
    plugins: [
      ...config.plugins,
      ["@react-native-google-signin/google-signin", { iosUrlScheme }],
    ],
  };
};
