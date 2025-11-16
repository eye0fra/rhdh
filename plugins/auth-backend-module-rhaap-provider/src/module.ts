import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { AAPAuthSignInResolvers } from './resolvers';
import { ansibleServiceRef } from '@ansible/backstage-rhaap-common';
import { aapAuthAuthenticator } from './authenticator'; // This should be a *function* that takes aapService and returns an authenticator

export const authModuleRhaapProvider = createBackendModule({
  pluginId: 'auth',
  moduleId: 'rhaap-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
        ansibleService: ansibleServiceRef,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
      },
      async init({ providers, ansibleService, discovery, auth, logger }) {
        logger.info('[auth-backend-module-rhaap-provider] Initializing RHAAP auth provider');
        logger.info(`[auth-backend-module-rhaap-provider] ansibleService: ${typeof ansibleService}, ${ansibleService ? 'provided' : 'missing'}`);
        
        // Register the provider synchronously
        providers.registerProvider({
          providerId: 'rhaap',
          factory: createOAuthProviderFactory({
            authenticator: aapAuthAuthenticator(ansibleService),
            signInResolverFactories: {
              usernameMatchingUser: AAPAuthSignInResolvers.usernameMatchingUser,
              allowNewAAPUserSignIn:
                AAPAuthSignInResolvers.allowNewAAPUserSignIn({
                  discovery,
                  auth,
                }),
            },
          }),
        });
        
        logger.info('[auth-backend-module-rhaap-provider] Successfully registered RHAAP auth provider');
      },
    });
  },
});
