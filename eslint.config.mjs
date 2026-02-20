import eslintConfigExpo from "eslint-config-expo/flat.js";

export default [
  ...eslintConfigExpo,
  {
    ignores: ["node_modules/", ".expo/", "ios/", "android/", "supabase/functions/"],
  },
];
