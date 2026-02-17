import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen safely outside of components.
 * @param {string} name - Screen name
 * @param {object} params - Optional navigation parameters
 */
export function navigate(name, params = {}) {
  if (!name) {
    console.warn("Navigation: No screen name provided.");
    return;
  }

  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn(
      `Navigation attempt to "${name}" failed: navigationRef is not ready.`
    );
  }
}

/**
 * Go back safely if possible.
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else {
    console.warn("Navigation: Cannot go back, either navigationRef not ready or no screens to go back to.");
  }
}

/**
 * Optional: Reset navigation to a specific screen (e.g., after logout/login)
 * @param {string} name - Screen name to reset to
 * @param {object} params - Optional params
 */
export function resetTo(name, params = {}) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name, params }],
    });
  } else {
    console.warn(
      `Navigation reset attempt to "${name}" failed: navigationRef is not ready.`
    );
  }
}
