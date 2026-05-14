// 'use client';
//
// import {UserDetails} from '@/types/user-details';
// import {
//     ReactElement,
//     useCallback,
//     useState,
//     createContext,
//     useContext,
// } from 'react';
//
// const AppContextDescriptor = createContext<AppContext | null>(null);
//
// export interface AppContextProviderProps {
//     children: ReactElement;
// }
//
// /**
//  * Reactive object used to update references to mutated entities like profile
//  * edits. In the future you will register used entities here, and websocket will
//  * notify you if something changed, so you can do stuff like this:
//  *
//  * `const user: UserDetails = useUser(user)`
//  *
//  * That will automatically notify you if observed user was mutated.
//  */
// export interface AppContext {
//     userDetails: UserDetails | undefined;
//     setUserDetails(value: UserDetails): void;
//     requireUser(): UserDetails;
// }
//
// export function useAppContext() {
//     const appContext = useContext(AppContextDescriptor);
//     if (!appContext) {
//         throw new Error(
//             'AppContext should be only used inside AppContextProvider',
//         );
//     }
//     return appContext;
// }
//
// export function AppContextProvider({
//     children,
// }: AppContextProviderProps): ReactElement {
//     const [userDetails, setUserDetails] = useState<UserDetails | undefined>();
//
//     const requireUser = useCallback(() => {
//         if (!userDetails) {
//             throw new Error('User is not initialized yet');
//         }
//         return userDetails;
//     }, [userDetails]);
//
//     const value: AppContext = {
//         userDetails,
//         setUserDetails,
//         requireUser,
//     };
//
//     return (
//         <AppContextDescriptor.Provider value={value}>
//             {children}
//         </AppContextDescriptor.Provider>
//     );
// }
