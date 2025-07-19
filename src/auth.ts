import * as database from "./Serendipy/prisma.js";
import { hasPerm } from "./perms.js";

interface StackAuthSessionData {
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

const getStackSession = async (
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
					x_stack_access_token: token,
				},
			}
		);
		const data: StackAuthSessionData = await response.json();
		return data;
	} catch (error) {
		console.error("Error calling Stack Auth API:", error);
	}
};

const getAuth = async (token: string, perm: string) => {
	let stackAuth: StackAuthSessionData;
	let apiToken: any;

	if (token === "" || token === null || token === undefined)
		throw new Error(
			"A token was not passed with this request, in the `Authorization` header. Please provide a valid token in the `Authorization` header."
		);
	else {
		try {
			const stackSessionResult = await getStackSession(token);
			if (
				stackSessionResult &&
				typeof stackSessionResult === "object" &&
				"id" in stackSessionResult
			) {
				stackAuth = stackSessionResult as StackAuthSessionData;
			} else {
				stackAuth = undefined as any;
			}
		} catch (error) {
			apiToken = await database.Applications.get(token);
		}

		const getUser = async (user_id: string) => {
			return await database.prisma.users.findUnique({
				where: {
					userid: user_id,
				},
				include: {
					posts: {
						include: {
							upvotes: true,
							downvotes: true,
							comments: true,
							plugins: true,
							user: true,
						},
					},
					applications: false,
					followers: {
						include: {
							user: false,
							target: true,
						},
					},
					following: {
						include: {
							user: false,
							target: true,
						},
					},
				},
			});
		};

		if (stackAuth) return getUser(stackAuth.server_metadata.uid) || null;
		else if (apiToken && "creatorid" in apiToken) {
			if (apiToken.active) {
				if (hasPerm(apiToken.permissions, perm))
					return getUser(apiToken.creatorid) || null;
				else
					throw new Error(
						`Missing Permissions. This token does not have enough permissions to perform this action. This token has access to ${apiToken.permissions.join(
							", "
						)}. To access this token, you must enable the following permissions on our Developer Portal: ${perm}. Please note that some of our permissions are Privilaged Access only and cannot be enabled on the Developer Portal.`
					);
			} else
				throw new Error(
					"Unauthorized. This token is not accepting requests, at this time. To continue allowing requests, re-enable the token on our Developer Portal."
				);
		} else return null;
	}
};

export { getAuth };
