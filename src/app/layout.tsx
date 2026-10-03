import './globals.css';
import {BlockingQRProvider} from '@/app/blocking-qr/page';
import {AppContextProvider} from '@/app.context';
import {Scaffold} from '@/app/scaffold';
import {Toaster} from '@/components/ui/sonner';
import {RootContainer} from '@/components/root-container';
import {BackendProvider} from '@/backend.context';
import {QueryProvider} from '@/components/query-provider';
import {SessionProvider} from '@/components/session-provider';
import IntlProvider from '@/components/intl-provider';
import {FriendlyStorageProvider} from '@/components/friendly-storage-provider';
import {DeferredLinkProvider} from '@/app/redirect/[deeplink]/deferred-link';
import {ImagePreviewer} from '@/components/image-previewer';
import {AppPage} from '@/app/page';
import {AppContext} from '@/app.context';

export interface RootLayoutProps {
    app: AppContext;
}

export function RootLayout({app}: RootLayoutProps) {
    const content = (
        <AppContextProvider preset={app}>
            <BackendProvider>
                <QueryProvider>
                    <FriendlyStorageProvider>
                        <SessionProvider>
                            <DeferredLinkProvider>
                                <IntlProvider>
                                    <RootContainer>
                                        <BlockingQRProvider>
                                            <Scaffold>
                                                <AppPage />
                                            </Scaffold>
                                            <Toaster richColors />
                                            <ImagePreviewer />
                                        </BlockingQRProvider>
                                    </RootContainer>
                                </IntlProvider>
                            </DeferredLinkProvider>
                        </SessionProvider>
                    </FriendlyStorageProvider>
                </QueryProvider>
            </BackendProvider>
        </AppContextProvider>
    );

    return content;
}
