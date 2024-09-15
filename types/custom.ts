interface GoogleUser {
  apiKey: string;
  appName: string;
  createdAt: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  lastLoginAt: string;
  photoURL: string;
  providerData: any[]; // Adjust type based on actual structure
  stsTokenManager: {
    accessToken: string;
    expirationTime: number;
    refreshToken: string;
  };
  uid: string;
}

interface UserData {
  daily_goal: number;
  name: string;
  created_at: string;
  paid: boolean;
  photo_url: string;
  email: string;
  watched_info: {
    [date: string]: {
      synced_with_ds: boolean;
      minutes_watched: number;
    };
  };
}
interface CustomDayCellProps {
  displayMonth: Date;
  date: Date;
}
