import client from "../api/client";

declare global {
  interface Window {
    google?: any;
  }
}

export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve();
    }
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google OAuth SDK script."));
    document.head.appendChild(script);
  });
}

export async function initiateGoogleLogin(
  onError: (msg: string) => void,
  onSubmitting: (submitting: boolean) => void
): Promise<void> {
  onSubmitting(true);
  try {
    await loadGoogleScript();

    const clientId =
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      "59451826816-qtgdbl65gh05d2t14qntp42pfv9ph4k8.apps.googleusercontent.com";

    if (!window.google?.accounts?.oauth2) {
      throw new Error("Google Identity Services library is unavailable.");
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid profile email",
      prompt: "select_account", // ALWAYS triggers Google's official account chooser screen
      callback: async (response: any) => {
        if (response.error) {
          onSubmitting(false);
          if (response.error !== "popup_closed_by_user") {
            onError("Google sign-in was cancelled or failed.");
          }
          return;
        }

        if (response.access_token) {
          try {
            // Fetch verified user identity directly from Google's UserInfo endpoint
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });

            if (!res.ok) {
              throw new Error("Could not retrieve profile from Google.");
            }

            const profile = await res.json();

            // Post verified Google user profile to backend
            const { data } = await client.post("/auth/google", {
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split("@")[0],
              googleId: profile.sub,
              avatar: profile.picture,
            });

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on backend user role
            if (data.user.role === "ADMIN") {
              window.location.href = "/hr/dashboard";
            } else {
              window.location.href = "/employee/dashboard";
            }
          } catch (err: any) {
            onError(err?.response?.data?.message || err?.message || "Google Authentication failed.");
          } finally {
            onSubmitting(false);
          }
        } else {
          onSubmitting(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  } catch (err: any) {
    onSubmitting(false);
    onError(err?.message || "Failed to initialize Google Sign-In.");
  }
}
