import { default as config } from '../config';
import log from '../log';
import { OAuthEnabledClient } from './oauthEnabledClient'; // Assuming this is the correct import for OAuthEnabledClient

interface TokenVerificationApi {
  verifyToken: (context: any) => Promise<boolean>;
}


const tokenVerificationApiFactory = (client: OAuthEnabledClient): TokenVerificationApi => {
  const verifyToken = (context: any) => {
    if (!config.apis.tokenVerification.enabled) {
      log.debug('Token verification disabled, returning token is valid');
      return Promise.resolve(true);
    }
    return client
        .post(context, `/token/verify`)
        .then((response) => Boolean(response.body && response.body.active))
        .catch(() => false);
  };

  return { verifyToken };
};

export { tokenVerificationApiFactory };

//
// const tokenVerificationApiFactory = (client) => {
//   const verifyToken = (context) => {
//     if (!config.apis.tokenVerification.enabled) {
//       log.debug('Token verification disabled, returning token is valid')
//       return true
//     }
//     return client
//       .post(context, `/token/verify`)
//       .then((response) => Boolean(response.body && response.body.active))
//       .catch(() => false)
//   }
//
//   return { verifyToken }
// }
//
// module.exports = { tokenVerificationApiFactory }
