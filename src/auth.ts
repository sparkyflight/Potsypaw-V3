import * as database from "./Serendipy/prisma.js";
import firebase from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { hasPerm } from "./perms.js";

const getAuth = async (token: string, perm: string) => {
	let firebaseAuth: DecodedIdToken;
	let apiToken: any;

	if (token === "" || token === null || token === undefined)
		throw new Error(
			"A token was not passed with this request, in the `Authorization` header. Please provide a valid token in the `Authorization` header."
		);
	else {
		try {
			firebaseAuth = await firebase.auth().verifyIdToken(token, true);
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
                        }
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

		if (firebaseAuth) return getUser(firebaseAuth.uid) || null;
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
