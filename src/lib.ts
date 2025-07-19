export interface StackAuthSessionData {
	requires_totp_mfa: boolean;
	auth_with_email: boolean;
	oauth_providers: {
		id: string;
		account_id: string;
		email: string;
	}[];
	is_anonymous: boolean;
	last_active_at_millis: number;
	server_metadata: any;
	client_read_only_metadata: any;
	client_metadata: any;
	passkey_auth_enabled: boolean;
	otp_auth_enabled: boolean;
	has_password: boolean;
	signed_up_at_millis: number;
	profile_image_url: string;
	selected_team_id: string | null;
	selected_team: string | null;
	display_name: string;
	primary_email_auth_enabled: boolean;
	primary_email_verified: boolean;
	primary_email: string;
	id: string;
}

export const getStackSession = async (
	token: string
): Promise<
	| StackAuthSessionData
	| {
			code: string;
			details: any;
			error: string;
	  }
> => {
	try {
		const response = await fetch(
			"https://auth.purrquinox.com/api/v1/users/me",
			{
				headers: {
					"x-stack-access-type": process.env.X_STACK_ACCESS_TYPE,
					"x-stack-project-id": process.env.X_STACK_PROJECT_ID,
					"x-stack-secret-server-key":
						process.env.X_STACK_SECRET_SERVER_KEY,
					"x-stack-access-token": token,
				},
			}
		);
		const data: StackAuthSessionData = await response.json();
		return data;
	} catch (error) {
		console.error("Error calling Stack Auth API:", error);
	}
};
