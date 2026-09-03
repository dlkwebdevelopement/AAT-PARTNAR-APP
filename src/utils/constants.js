// ─── Deep Blue Theme Tokens ───────────────────────────────────────────────
export const T = {
  blue900: "#0B1A3D",
  blue800: "#132D6B",
  blue700: "#1B3D8F",
  blue600: "#2563EB",
  blue500: "#3B82F6",
  blue400: "#60A5FA",
  blue100: "#DBEAFE",
  blue50: "#EFF6FF",
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray300: "#CBD5E1",
  gray400: "#9CA3AF",
  gray500: "#64748B",
  gray800: "#1E293B",
  red: "#EF4444",
  redDark: "#DC2626",
  shadow: "rgba(11, 26, 61, 0.12)",
};

// ─── Global Colors (Mapped to Deep Blue Theme) ───────────────────────────
export const colors = {
  // Re-mapping green to blue for legacy usages
  dark_green: T.blue600,       
  light_green: T.blue500,      
  label_green: T.blue50,       
  very_light_green: T.blue100, 
  pale_green: T.blue50,        

  // Darkest blue instead of hard black
  black: T.blue900,
  
  // Grays
  dark_gray: T.gray500,
  gray: T.gray300,
  light_gray: T.gray100,
  very_light_gray: T.gray50,
  placeholder_gray: T.gray400,
  smoke_white: T.gray50,
  
  // Standard colors
  white: T.white,
  red: T.red,
  blue: T.blue500,
  deep_blue: T.blue800,        
  // ─── Linear Gradients ──────────────────────────────────────────────────
  premium_blue_gradient: [T.blue900, T.blue700, T.blue900], // Deep Blue glowing center
  deep_blue_gradient: [T.blue900, T.blue700, T.blue600],
  primary_gradient: [T.blue600, T.blue400],
  ocean_gradient: ["#0284C7", T.blue600],
  dark_gradient: [T.blue900, T.gray800],
  gold_gradient: ["#FBBF24", "#D97706"],
  success_gradient: ["#10B981", "#047857"],
  danger_gradient: [T.red, T.redDark],
  
  // Keep these as they are or adapt slightly
  yellow: '#FBBF24',
  light_yellow: '#FEF3C7',
  light_orange: '#FFEDD5',
  light_purple: '#F3E8FF',
  light_blue: T.blue100,
};
