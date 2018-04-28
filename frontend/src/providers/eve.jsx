import { API_ROOT } from '../api-config';

export interface Session {
    accessToken: string,
    expireDurationSeconds: number,
    refreshToken: string,
    characterID: number
}



export const eveProvider = {
    buildAuthorizeUrl() {
      return API_ROOT + 'auth.php';

    },

    extractError(redirectUrl: string): Error | undefined {
        const errorMatch = redirectUrl.match(/error=([^&]+)/)
        if (!errorMatch) {
            return undefined
        }

        const errorReason = errorMatch[1]
        const errorDescriptionMatch = redirectUrl.match(/error_description=([^&]+)/)
        const errorDescription = errorDescriptionMatch ? errorDescriptionMatch[1] : ''
        return new Error(`Error during login. Reason: ${errorReason} Description: ${errorDescription}`)
    },

    extractSession(redirectUrl: string): Session {
        let access_token = null;
        const accessTokenMatch = redirectUrl.match(/access_token=([^&]+)/)
        if (accessTokenMatch) {
            access_token = accessTokenMatch[1]
        }

        let refresh_token = null;
        const refreshTokenMatch = redirectUrl.match(/refresh_token=([^&]+)/)
        if (refreshTokenMatch) {
            refresh_token = refreshTokenMatch[1]
        }



        return {
            access_token,
            refresh_token
        }
    },

    validateSession(session: Session): boolean {
        //FIXME: write an eve version

        return true
    },

    getAccessToken(session: Session, resourceId: string): string {
      //FIXME: what is this for?
        return session.accessToken
    },

    getSignOutUrl(redirectUrl: string): string {
        //FIXME: write eve version
    }
}
